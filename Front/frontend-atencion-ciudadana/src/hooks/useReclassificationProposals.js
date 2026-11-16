import { useCallback, useEffect, useRef, useState } from "react";
import { fetchReclassificationProposals } from "../services/apiClient";

export function useReclassificationProposals(ticket, enabled) {
  const [state, setState] = useState({ ticket: null, proposals: [], loading: true, error: null });
  const generation = useRef(0);
  const request = useRef(0);
  const reload = useCallback(async () => {
    if (!enabled || !ticket) return;
    const context = generation.current;
    const current = ++request.current;
    try {
      const proposals = await fetchReclassificationProposals(ticket.id);
      if (context !== generation.current || current !== request.current) return;
      setState({ ticket, proposals, loading: false, error: null });
    } catch (error) {
      if (context !== generation.current || current !== request.current) return;
      setState({ ticket, proposals: [], loading: false, error });
    }
  }, [enabled, ticket]);
  useEffect(() => {
    let cancelled = false;
    const current = ++request.current;
    if (enabled && ticket) {
      fetchReclassificationProposals(ticket.id).then(
        (proposals) => { if (!cancelled && current === request.current) setState({ ticket, proposals, loading: false, error: null }); },
        (error) => { if (!cancelled && current === request.current) setState({ ticket, proposals: [], loading: false, error }); },
      );
    }
    return () => { cancelled = true; generation.current += 1; };
  }, [ticket, enabled]);
  return { ...state, proposals: state.ticket === ticket ? state.proposals : [], loading: enabled && state.ticket !== ticket, reload };
}
