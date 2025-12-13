import React from 'react';
import type { TabType } from './utils';

interface TabNavigationProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    totalCards: number;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange, totalCards }) => {
    return (
        <div className="tab-navigation">
            <button
                className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
                onClick={() => onTabChange('search')}
            >
                🔍 Buscar Cartas
            </button>
            <button
                className={`tab-button ${activeTab === 'deck' ? 'active' : ''}`}
                onClick={() => onTabChange('deck')}
            >
                🃏 Meu Deck ({totalCards})
            </button>
        </div>
    );
};

export default TabNavigation;