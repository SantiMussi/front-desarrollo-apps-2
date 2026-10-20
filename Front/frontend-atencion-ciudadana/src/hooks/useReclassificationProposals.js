import { useCallback, useEffect, useState } from "react";
import { fetchReclassificationProposals } from "../services/apiClient";

export function useReclassificationProposals(ticket, enabled) {
  const [state, setState] = useState({ ticket: null, proposals: [], loading: true, error: null });
  const reload = useCallback(async () => {
    if (!enabled || !ticket) return;
    try {
      const proposals = await fetchReclassificationProposals(ticket.id);
      setState({ ticket, proposals, loading: false, error: null });
    } catch (error) {
      setState({ ticket, proposals: [], loading: false, error });
    }
  }, [enabled, ticket]);
  useEffect(() => {
    let cancelled = false;
    if (enabled && ticket) {
      fetchReclassificationProposals(ticket.id).then(
        (proposals) => { if (!cancelled) setState({ ticket, proposals, loading: false, error: null }); },
        (error) => { if (!cancelled) setState({ ticket, proposals: [], loading: false, error }); },
      );
    }
    return () => { cancelled = true; };
  }, [ticket, enabled]);
  return { ...state, proposals: state.ticket === ticket ? state.proposals : [], loading: enabled && state.ticket !== ticket, reload };
}
