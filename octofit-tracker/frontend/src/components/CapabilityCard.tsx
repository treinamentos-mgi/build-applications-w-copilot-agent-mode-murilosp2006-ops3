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

const LOAD_ERROR_TEXT = 'Não foi possível carregar os dados. Tente novamente mais tarde.';

export function CapabilityCard<T>({ title, description, path, isEmpty, emptyText, render }: Props<T>) {
  const state = useApiData<T>(path);
  let content: ReactNode = null;
  if (state.status === 'loading') content = <p role="status">Carregando dados...</p>;
  if (state.status === 'error') content = <p role="alert" className="text-danger">{LOAD_ERROR_TEXT}</p>;
  if (state.status === 'ready') {
    // Respostas com formato inesperado lançam exceção em isEmpty/render; mostramos o erro em vez de quebrar a tela.
    try {
      content = isEmpty(state.data) ? <p className="text-muted">{emptyText}</p> : render(state.data);
    } catch {
      content = <p role="alert" className="text-danger">{LOAD_ERROR_TEXT}</p>;
    }
  }
  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {content}
      </div>
    </section>
  );
}
