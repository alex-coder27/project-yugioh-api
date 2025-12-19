import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchControls from '../SearchControls';

describe('SearchControls Component', () => {
    const mockOnSearchChange = jest.fn();
    const mockOnTypeChange = jest.fn();
    const mockOnAttributeChange = jest.fn();
    const mockOnSubtypeChange = jest.fn();
    const mockOnLevelChange = jest.fn();
    const mockOnAtkChange = jest.fn();
    const mockOnDefChange = jest.fn();
    const mockOnBanishedToggle = jest.fn();

    const defaultProps = {
        searchTerm: '',
        selectedType: '',
        selectedAttribute: '',
        selectedRace: '',
        levelSearch: '',
        atkSearch: '',
        defSearch: '',
        includeBanishedCards: false,
        onSearchChange: mockOnSearchChange,
        onTypeChange: mockOnTypeChange,
        onAttributeChange: mockOnAttributeChange,
        onSubtypeChange: mockOnSubtypeChange,
        onLevelChange: mockOnLevelChange,
        onAtkChange: mockOnAtkChange,
        onDefChange: mockOnDefChange,
        onBanishedToggle: mockOnBanishedToggle,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('deve renderizar campo de busca', () => {
        render(<SearchControls {...defaultProps} />);

        const searchInput = screen.getByPlaceholderText(/Nome da Carta/i);
        expect(searchInput).toBeInTheDocument();
    });

    it('deve renderizar select de tipo de carta', () => {
        render(<SearchControls {...defaultProps} />);

        const typeSelect = screen.getByDisplayValue(/Tipo de Carta/i);
        expect(typeSelect).toBeInTheDocument();
    });

    it('deve chamar onSearchChange ao digitar no campo de busca', () => {
        render(<SearchControls {...defaultProps} />);

        const searchInput = screen.getByPlaceholderText(/Nome da Carta/i);
        fireEvent.change(searchInput, { target: { value: 'Blue-Eyes' } });

        expect(mockOnSearchChange).toHaveBeenCalled();
    });

    it('deve chamar onTypeChange ao selecionar tipo', () => {
        render(<SearchControls {...defaultProps} />);

        const typeSelect = screen.getByDisplayValue(/Tipo de Carta/i);
        fireEvent.change(typeSelect, { target: { value: 'Effect Monster' } });

        expect(mockOnTypeChange).toHaveBeenCalled();
    });

    it('deve exibir filtros de monstro quando tipo de monstro é selecionado', () => {
        render(<SearchControls {...defaultProps} selectedType="Effect Monster" />);

        const selects = screen.getAllByRole('combobox');
        
        expect(selects.length).toBeGreaterThanOrEqual(6);

        const attributeSelect = selects.find(select => 
            Array.from(select.children).some(child => 
                child.textContent?.includes('Atributo')
            )
        );
        expect(attributeSelect).toBeInTheDocument();
        
        const raceSelect = selects.find(select => 
            Array.from(select.children).some(child => 
                child.textContent?.includes('Raça')
            )
        );
        expect(raceSelect).toBeInTheDocument();
        
        const levelSelect = selects.find(select => 
            Array.from(select.children).some(child => 
                child.textContent?.includes('Nível')
            )
        );
        expect(levelSelect).toBeInTheDocument();
        
        const atkSelect = selects.find(select => 
            Array.from(select.children).some(child => 
                child.textContent === 'ATK' || child.textContent?.includes('ATK:')
            )
        );
        expect(atkSelect).toBeInTheDocument();
        
        const defSelect = selects.find(select => 
            Array.from(select.children).some(child => 
                child.textContent === 'DEF' || child.textContent?.includes('DEF:')
            )
        );
        expect(defSelect).toBeInTheDocument();
    });

    it('deve exibir filtro de subtipo para Spell/Trap', () => {
        render(<SearchControls {...defaultProps} selectedType="Spell Card" />);

        const selects = screen.getAllByRole('combobox');
        const subtypeSelect = selects.find(select => 
            Array.from(select.children).some(child => 
                child.textContent?.includes('Subtipo')
            )
        );
        expect(subtypeSelect).toBeInTheDocument();
    });

    it('não deve exibir filtros de monstro para Spell Card', () => {
        render(<SearchControls {...defaultProps} selectedType="Spell Card" />);

        const selects = screen.getAllByRole('combobox');
        
        const hasAttributeSelect = selects.some(select => 
            Array.from(select.children).some(child => 
                child.textContent?.includes('Atributo')
            )
        );
        const hasLevelSelect = selects.some(select => 
            Array.from(select.children).some(child => 
                child.textContent?.includes('Nível')
            )
        );
        
        expect(hasAttributeSelect).toBe(false);
        expect(hasLevelSelect).toBe(false);
    });

    it('deve chamar onAttributeChange ao selecionar atributo', () => {
        render(<SearchControls {...defaultProps} selectedType="Effect Monster" />);

        const selects = screen.getAllByRole('combobox');
        const attributeSelect = selects.find(select => 
            Array.from(select.children).some(child => 
                child.textContent?.includes('Atributo')
            )
        );
        
        expect(attributeSelect).toBeInTheDocument();
        fireEvent.change(attributeSelect!, { target: { value: 'DARK' } });

        expect(mockOnAttributeChange).toHaveBeenCalled();
    });

    it('deve chamar onLevelChange ao selecionar nível', () => {
        render(<SearchControls {...defaultProps} selectedType="Effect Monster" />);

        const selects = screen.getAllByRole('combobox');
        const levelSelect = selects.find(select => 
            Array.from(select.children).some(child => 
                child.textContent?.includes('Nível')
            )
        );
        
        expect(levelSelect).toBeInTheDocument();
        fireEvent.change(levelSelect!, { target: { value: '4' } });

        expect(mockOnLevelChange).toHaveBeenCalled();
    });

    it('deve renderizar toggle de cartas proibidas', () => {
        render(<SearchControls {...defaultProps} />);

        expect(screen.getByText(/Incluir Proibidas/i)).toBeInTheDocument();
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).toBeInTheDocument();
    });

    it('deve chamar onBanishedToggle ao clicar no toggle', () => {
        render(<SearchControls {...defaultProps} />);

        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);

        expect(mockOnBanishedToggle).toHaveBeenCalled();
    });

    it('deve marcar checkbox quando includeBanishedCards é true', () => {
        render(<SearchControls {...defaultProps} includeBanishedCards={true} />);

        const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
        expect(checkbox.checked).toBe(true);
    });

    it('deve exibir valor do searchTerm no input', () => {
        render(<SearchControls {...defaultProps} searchTerm="Dark Magician" />);

        const searchInput = screen.getByPlaceholderText(/Nome da Carta/i) as HTMLInputElement;
        expect(searchInput.value).toBe('Dark Magician');
    });

    it('deve ter minLength de 3 no campo de busca', () => {
        render(<SearchControls {...defaultProps} />);

        const searchInput = screen.getByPlaceholderText(/Nome da Carta/i);
        expect(searchInput).toHaveAttribute('minLength', '3');
    });

    it('deve chamar onAtkChange ao selecionar ATK', () => {
        render(<SearchControls {...defaultProps} selectedType="Effect Monster" />);

        const selects = screen.getAllByRole('combobox');
        const atkSelect = selects.find(select => 
            Array.from(select.children).some(child => 
                child.textContent === 'ATK' || child.textContent?.includes('ATK:')
            )
        );
        
        expect(atkSelect).toBeInTheDocument();
        fireEvent.change(atkSelect!, { target: { value: '2000' } });

        expect(mockOnAtkChange).toHaveBeenCalled();
    });

    it('deve chamar onDefChange ao selecionar DEF', () => {
        render(<SearchControls {...defaultProps} selectedType="Effect Monster" />);

        const selects = screen.getAllByRole('combobox');
        const defSelect = selects.find(select => 
            Array.from(select.children).some(child => 
                child.textContent === 'DEF' || child.textContent?.includes('DEF:')
            )
        );
        
        expect(defSelect).toBeInTheDocument();
        fireEvent.change(defSelect!, { target: { value: '1500' } });

        expect(mockOnDefChange).toHaveBeenCalled();
    });
});