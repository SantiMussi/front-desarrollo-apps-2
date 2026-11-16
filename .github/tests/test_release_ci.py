"""Exercise release job conditions and the secret scanner's safe output boundary."""
import ast
import importlib.util
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import tomllib
import unittest

ROOT = Path(__file__).resolve().parents[2]
FLOW = (ROOT / '.github/workflows/ci.yml').read_text(encoding='utf-8')
SPEC = importlib.util.spec_from_file_location('secret_scan', ROOT / '.github/scripts/check-secrets.py')
SCANNER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SCANNER)
SONAR_SPEC = importlib.util.spec_from_file_location('sonar_policy', ROOT / '.github/scripts/check-sonar.py')
SONAR_POLICY = importlib.util.module_from_spec(SONAR_SPEC)
SONAR_SPEC.loader.exec_module(SONAR_POLICY)



def job(name):
    match = re.search(r'^  ' + name + r':\n(.*?)(?=(?:^  [\w-]+:\n)|\Z)', FLOW, re.M | re.S)
    return match.group(1) if match else None


def enabled(name, event, ref, cd='true', provider='M1'):
    body = job(name)
    if body is None:
        return False
    match = re.search(r'^    if: (.*)$', body, re.M)
    if not match:
        raise AssertionError('Publication/deployment must have an explicit job condition')
    expression = match.group(1)
    if expression == '>-':
        lines = []
        for line in body[match.end():].splitlines():
            if not line.strip():
                continue
            if line.startswith('      ') and not line.startswith('       '):
                lines.append(line.strip())
            else:
                break
        expression = ' '.join(lines)
    values = {'github.event_name': event, 'github.ref': ref, 'vars.CD_ENABLED': cd,
              'inputs.identity_provider': provider}
    expression = re.sub(r'github\.event_name|github\.ref|vars\.CD_ENABLED|inputs\.identity_provider',
                        lambda m: repr(values[m.group()]), expression)
    tree = ast.parse(expression.replace('&&', ' and ').replace('||', ' or '), mode='eval')
    allowed = (ast.Expression, ast.BoolOp, ast.And, ast.Or, ast.Compare, ast.Eq, ast.NotEq, ast.Constant)
    if any(not isinstance(node, allowed) for node in ast.walk(tree)):
        raise AssertionError('Unsupported condition; review evaluator before changing policy')
    return eval(compile(tree, '<job-condition>', 'eval'), {'__builtins__': {}}, {})


def dependencies(name):
    match = re.search(r'^    needs: (.+)$', job(name), re.M)
    return [part.strip() for part in match.group(1).strip('[]').split(',')] if match else []


def outcome(name, event, ref, results=None, cd='true', provider='M1'):
    """Model the documented default success prerequisite using the actual needs graph."""
    if name in (results or {}):
        return results[name]
    if job(name) is None:
        return 'skipped'
    if any(outcome(parent, event, ref, results, cd, provider) != 'success'
           for parent in dependencies(name)):
        return 'skipped'
    if name == 'sonar':
        main = 'master' if 'Backend CI' in FLOW else 'main'
        if SONAR_POLICY.analysis_mode(event, ref, '', main) == 'unsupported':
            return 'skipped'
    if name in ('publish', 'deploy') and not enabled(name, event, ref, cd, provider):
        return 'skipped'
    return 'success'


class ReleasePolicyTests(unittest.TestCase):
    def test_g6_failure_skip_or_cancellation_blocks_every_publication_path(self):
        for event, ref in (('push', 'refs/heads/main'),
                           ('workflow_dispatch', 'refs/heads/main')):
            for status in ('failure', 'cancelled', 'skipped'):
                for name in ('publish', 'deploy'):
                    with self.subTest(event=event, ref=ref, status=status, job=name):
                        self.assertIn('secrets', dependencies(name))
                        self.assertEqual(outcome(name, event, ref, {'secrets': status}), 'skipped')

    def test_quality_and_sca_failure_skip_or_cancel_block_publication_and_deployment(self):
        for gate in ('sonar', 'security'):
            for status in ('failure', 'skipped', 'cancelled'):
                for event, ref in (('push', 'refs/heads/main'), ('workflow_dispatch', 'refs/heads/main')):
                    for name in ('publish', 'deploy'):
                        with self.subTest(gate=gate, status=status, job=name):
                            self.assertEqual(outcome(name, event, ref, {gate: status}), 'skipped')

    def test_dev_validation_is_independent_of_sonar_but_cannot_publish(self):
        for event in ('push', 'workflow_dispatch'):
            for name in ('configuration', 'validate', 'security'):
                self.assertEqual(outcome(name, event, 'refs/heads/dev'), 'success')
            self.assertEqual(outcome('sonar', event, 'refs/heads/dev'), 'skipped')
            for name in ('publish', 'deploy'):
                self.assertEqual(outcome(name, event, 'refs/heads/dev'), 'skipped')
        self.assertEqual(outcome('deploy', 'push', 'refs/heads/dev', cd='false'), 'skipped')
        for validation in ('configuration', 'validate', 'sonar', 'security') + (('e2e',) if 'Frontend CI' in FLOW else ()):
            for name in ('publish', 'deploy'):
                with self.subTest(validation=validation, job=name):
                    self.assertEqual(outcome(name, 'push', 'refs/heads/dev',
                                             {'secrets': 'success', validation: 'failure'}), 'skipped')
        main = 'master' if 'Backend CI' in FLOW else 'main'
        self.assertEqual(outcome('sonar', 'push', 'refs/heads/' + main), 'success')
        self.assertEqual(outcome('sonar', 'push', 'refs/tags/v2.0-entrega4'), 'success')
        if 'Frontend CI' in FLOW:
            for gate in ('configuration', 'validate', 'e2e', 'secrets', 'sonar', 'security'):
                for status in ('failure', 'skipped', 'cancelled'):
                    self.assertEqual(outcome('publish', 'workflow_dispatch', 'refs/heads/main', {gate: status}), 'skipped')
            self.assertEqual(outcome('publish', 'workflow_dispatch', 'refs/heads/main'), 'success')
            self.assertEqual(outcome('deploy', 'workflow_dispatch', 'refs/heads/main'), 'skipped')
        for name in ('publish', 'deploy'):
            self.assertEqual(outcome(name, 'push', 'refs/tags/v2.0-entrega4'), 'skipped')

    def test_security_gate_cannot_be_bypassed_by_status_or_error_overrides(self):
        for name in ('publish', 'deploy'):
            body = job(name)
            condition = re.search(r'^    if: (.*?)(?=(?:^    [\w-]+:)|\Z)', body, re.M | re.S).group(1)
            self.assertNotRegex(condition, r'\b(always|failure|cancelled)\s*\(')
            self.assertNotRegex(body, r'(?m)^    continue-on-error:')
        scan = job('secrets')
        self.assertNotIn('continue-on-error', scan)
        self.assertNotRegex(scan, r'(?m)^    if:')
        step = re.search(r'      - name: Scan secrets[^\n]*\n(.*?)(?=      - name:|\Z)', scan, re.S).group(1)
        self.assertNotRegex(step, r'(?m)^\s*if:|\|\|\s*(true|exit\s+0)')
        self.assertIn('run: python3 .github/scripts/check-secrets.py --output', step)

    def test_tag_trigger_and_existing_branch_triggers(self):
        push = FLOW.split('  push:\n', 1)[1].split('  workflow_dispatch:', 1)[0]
        self.assertRegex(push, r"tags:\s*\n\s*- 'v\*'")
        self.assertIn('- dev', push)
        self.assertIn('- master' if 'Backend CI' in FLOW else '- main', push)

    def test_tags_cannot_publish_or_deploy_even_with_cd_enabled_and_m1(self):
        for tag in ('v2.0-entrega4', 'v1.2.3', 'v-next'):
            for event in ('push', 'workflow_dispatch', 'release'):
                for name in ('publish', 'deploy'):
                    with self.subTest(tag=tag, event=event, job=name):
                        self.assertFalse(enabled(name, event, 'refs/tags/' + tag))

    def test_main_cd_and_manual_publication_policy(self):
        for name in ('publish', 'deploy'):
            self.assertFalse(enabled(name, 'push', 'refs/heads/dev'))
            self.assertTrue(enabled(name, 'push', 'refs/heads/main'))
            self.assertFalse(enabled(name, 'push', 'refs/tags/v2.0-entrega4'))
            self.assertFalse(enabled(name, 'pull_request', 'refs/pull/1/merge'))
        self.assertFalse(enabled('deploy', 'push', 'refs/heads/main', cd='false'))
        self.assertTrue(enabled('publish', 'workflow_dispatch', 'refs/heads/main'))
        self.assertFalse(enabled('publish', 'workflow_dispatch', 'refs/heads/main', provider='MOCK'))
        self.assertFalse(enabled('publish', 'workflow_dispatch', 'refs/heads/dev'))
        self.assertFalse(enabled('deploy', 'workflow_dispatch', 'refs/heads/main'))
        self.assertEqual(outcome('deploy', 'push', 'refs/heads/main'), 'success')
        self.assertNotIn('security', dependencies('sonar'))
        self.assertNotIn('secrets', dependencies('sonar'))

    def test_existing_suites_and_gates_are_not_replaced(self):
        if 'Backend CI' in FLOW:
            self.assertIn('./mvnw -B clean verify', FLOW)
            self.assertIn('<minimum>0.85</minimum>', (ROOT / 'pom.xml').read_text())
        elif 'Frontend CI' in FLOW:
            for command in ('npm run lint', 'npm run test:coverage', 'npm run test:e2e', 'npm run build'):
                self.assertIn(command, FLOW)
            config = (ROOT / 'Front/frontend-atencion-ciudadana/vitest.config.js').read_text()
            for metric in ('statements', 'branches', 'functions', 'lines'):
                self.assertRegex(config, metric + r':\s*85')
            self.assertEqual(dependencies('publish'), ['configuration', 'validate', 'e2e', 'secrets', 'sonar', 'security'])
        else:
            self.assertIn('python3 -m unittest discover -s tests -v', FLOW)
            self.assertIn('terraform validate', FLOW)

    def test_scan_requires_full_checkout_and_only_uploads_sanitized_report(self):
        scan = job('secrets')
        self.assertIn('fetch-depth: 0', scan)
        self.assertIn('persist-credentials: false', scan)
        self.assertIn('check-secrets.py --output', scan)
        self.assertIn('path: ${{ runner.temp }}/secrets-summary.json', scan)
        self.assertIn('if: always()', scan)

    @unittest.skipUnless((ROOT / '.github/scripts/resolve-provider.sh').exists(), 'No provider selector in Infra')
    def test_actual_selector_uses_mock_for_tag_validation(self):
        bash = r'C:\Program Files\Git\bin\bash.exe' if os.name == 'nt' else shutil.which('bash')
        with tempfile.TemporaryDirectory(prefix='m2-tag-policy-') as directory:
            output = Path(directory) / 'output'
            env = {**os.environ, 'GITHUB_EVENT_NAME': 'push', 'GITHUB_REF': 'refs/tags/v2.0-entrega4',
                   'CD_IDENTITY_PROVIDER': 'M1', 'INPUT_IDENTITY_PROVIDER': '', 'GITHUB_OUTPUT': str(output)}
            completed = subprocess.run([bash, '.github/scripts/resolve-provider.sh'], cwd=ROOT,
                                       env=env, capture_output=True, timeout=10)
            self.assertEqual(completed.returncode, 0)
            self.assertEqual(output.read_text().strip(), 'identity_provider=MOCK')


class SecretOutputTests(unittest.TestCase):
    def test_raw_content_is_never_exported(self):
        sensitive = 'PRIVATE_VALUE_FOR_REDACTION_CHECK'
        findings = [{'RuleID': 'test', 'File': 'sample.py', 'StartLine': 4, 'EndLine': 4,
                     'Commit': 'a' * 40, 'Secret': sensitive, 'Match': sensitive,
                     'Line': sensitive, 'Description': sensitive}]
        self.assertEqual(set(SCANNER.metadata(findings)[0]), set(SCANNER.FIELDS))
        self.assertNotIn(sensitive, str(SCANNER.metadata(findings)))

    def test_configuration_keeps_official_rules_and_limits_fixture_exception(self):
        config = tomllib.loads((ROOT / '.gitleaks.toml').read_text())
        self.assertTrue(config['extend']['useDefault'])
        self.assertNotIn('allowlists', config)
        for rule in config['rules']:
            for exception in rule.get('allowlists', []):
                self.assertEqual(exception['condition'], 'AND')
                self.assertEqual(exception['regexTarget'], 'secret')
                self.assertEqual(len(exception['regexes']), 1)
                self.assertNotIn('commits', exception)
                self.assertTrue(all(path.endswith('$') for path in exception['paths']))


if __name__ == '__main__':
    unittest.main()
