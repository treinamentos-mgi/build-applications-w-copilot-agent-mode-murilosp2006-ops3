import { useEffect, useState } from 'react';

export type ApiState<T> = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: T };

// `load` deve ter referência estável (definida no módulo), pois muda o efeito a cada renderização.
export function useApiData<T>(load: () => Promise<T>): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    load().then(
      (data) => { if (active) setState({ status: 'ready', data }); },
      () => { if (active) setState({ status: 'error' }); },
    );
    return () => { active = false; };
  }, [load]);

  return state;
}
