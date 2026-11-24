import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App.js';

describe('Estado de erro para respostas com formato inesperado', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  for (const route of ['/activities', '/teams', '/leaderboard', '/workouts']) {
    it(`exibe alerta em ${route} quando a API responde 200 sem a lista esperada`, async () => {
      vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ outro: [] }), { status: 200 })));
      render(<MemoryRouter initialEntries={[route]}><App /></MemoryRouter>);
      await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/não foi possível carregar/i));
      expect(screen.getByRole('heading', { level: 1, name: /octofit tracker/i })).toBeInTheDocument();
    });
  }
});
