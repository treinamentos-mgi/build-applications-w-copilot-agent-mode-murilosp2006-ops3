import type { ReactNode } from 'react';
import { useApiData } from '../hooks/useApiData.js';

type Props<T> = {
  title: string;
  description: string;
  path: string;
  isEmpty: (data: T) => boolean;
  emptyText: string;
  render: (data: T) => ReactNode;
};

export function CapabilityCard<T>({ title, description, path, isEmpty, emptyText, render }: Props<T>) {
  const state = useApiData<T>(path);
  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {state.status === 'loading' && <p role="status">Carregando dados...</p>}
        {state.status === 'error' && <p role="alert" className="text-danger">Não foi possível carregar os dados. Tente novamente mais tarde.</p>}
        {state.status === 'ready' && (isEmpty(state.data) ? <p className="text-muted">{emptyText}</p> : render(state.data))}
      </div>
    </section>
  );
}
