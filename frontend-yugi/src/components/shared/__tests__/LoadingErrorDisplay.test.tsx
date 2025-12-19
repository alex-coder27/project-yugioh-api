import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoadingErrorDisplay from '../LoadingErrorDisplay';

describe('LoadingErrorDisplay Component', () => {
  const mockOnRetry = jest.fn();

  beforeEach(() => {
    mockOnRetry.mockClear();
  });

  it('deve exibir mensagem de carregamento quando isLoading é true', () => {
    render(
      <LoadingErrorDisplay
        isLoading={true}
        error={null}
        hasShortTermOnly={false}
        hasResults={false}
        searchTerm=""
        onRetry={mockOnRetry}
      />
    );

    expect(screen.getByText('Carregando cartas...')).toBeInTheDocument();
  });

  it('deve exibir mensagem de erro quando error está presente', () => {
    render(
      <LoadingErrorDisplay
        isLoading={false}
        error="Erro ao buscar cartas"
        hasShortTermOnly={false}
        hasResults={false}
        searchTerm="test"
        onRetry={mockOnRetry}
      />
    );

    expect(screen.getByText('Erro ao buscar cartas')).toBeInTheDocument();
    expect(screen.getByText('↻ Tentar Novamente')).toBeInTheDocument();
  });

  it('deve exibir hint quando hasShortTermOnly é true', () => {
    render(
      <LoadingErrorDisplay
        isLoading={false}
        error="Erro ao buscar cartas"
        hasShortTermOnly={true}
        hasResults={false}
        searchTerm="ab"
        onRetry={mockOnRetry}
      />
    );

    expect(screen.getByText('Digite pelo menos 3 caracteres para buscar.')).toBeInTheDocument();
  });

  it('deve chamar onRetry quando botão de tentar novamente é clicado', () => {
    render(
      <LoadingErrorDisplay
        isLoading={false}
        error="Erro ao buscar cartas"
        hasShortTermOnly={false}
        hasResults={false}
        searchTerm="test"
        onRetry={mockOnRetry}
      />
    );

    const retryButton = screen.getByText('↻ Tentar Novamente');
    fireEvent.click(retryButton);

    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('deve exibir mensagem vazia quando não há resultados e searchTerm está vazio', () => {
    render(
      <LoadingErrorDisplay
        isLoading={false}
        error={null}
        hasShortTermOnly={false}
        hasResults={false}
        searchTerm=""
        onRetry={mockOnRetry}
      />
    );

    expect(screen.getByText('Digite um nome para buscar cartas.')).toBeInTheDocument();
  });

  it('deve exibir mensagem quando não há resultados com termo de busca válido', () => {
    render(
      <LoadingErrorDisplay
        isLoading={false}
        error={null}
        hasShortTermOnly={false}
        hasResults={false}
        searchTerm="carta inexistente"
        onRetry={mockOnRetry}
      />
    );

    expect(screen.getByText('Nenhuma carta encontrada. Tente outros termos.')).toBeInTheDocument();
  });

  it('deve exibir botão de buscar novamente quando searchTerm tem 3+ caracteres', () => {
    render(
      <LoadingErrorDisplay
        isLoading={false}
        error={null}
        hasShortTermOnly={false}
        hasResults={false}
        searchTerm="abc"
        onRetry={mockOnRetry}
      />
    );

    expect(screen.getByText('↻ Buscar Novamente')).toBeInTheDocument();
  });

  it('não deve renderizar nada quando hasResults é true', () => {
    const { container } = render(
      <LoadingErrorDisplay
        isLoading={false}
        error={null}
        hasShortTermOnly={false}
        hasResults={true}
        searchTerm="test"
        onRetry={mockOnRetry}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('deve exibir mensagem para termo curto quando hasShortTermOnly é true e sem erro', () => {
    render(
      <LoadingErrorDisplay
        isLoading={false}
        error={null}
        hasShortTermOnly={true}
        hasResults={false}
        searchTerm="ab"
        onRetry={mockOnRetry}
      />
    );

    expect(screen.getByText('Digite pelo menos 3 caracteres para buscar.')).toBeInTheDocument();
  });

  it('deve priorizar loading sobre outras mensagens', () => {
    render(
      <LoadingErrorDisplay
        isLoading={true}
        error="Algum erro"
        hasShortTermOnly={false}
        hasResults={false}
        searchTerm="test"
        onRetry={mockOnRetry}
      />
    );

    expect(screen.getByText('Carregando cartas...')).toBeInTheDocument();
    expect(screen.queryByText('Algum erro')).not.toBeInTheDocument();
  });

  it('deve priorizar erro sobre mensagem vazia', () => {
    render(
      <LoadingErrorDisplay
        isLoading={false}
        error="Erro de conexão"
        hasShortTermOnly={false}
        hasResults={false}
        searchTerm=""
        onRetry={mockOnRetry}
      />
    );

    expect(screen.getByText('Erro de conexão')).toBeInTheDocument();
    expect(screen.queryByText('Digite um nome para buscar cartas.')).not.toBeInTheDocument();
  });
});