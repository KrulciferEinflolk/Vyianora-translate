import React, { useState } from 'react';
import RootManager from './RootManager';
import ModifierManager from './ModifierManager';
import CategoryManager from './CategoryManager';
import { Book, Layers, Tag } from 'lucide-react';

export default function LexiconManager({ roots, setRoots, categories, prefixes, setPrefixes, suffixes, setSuffixes }) {
    const [subTab, setSubTab] = useState('roots');

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 border-b border-border pb-4 mb-6 justify-center md:justify-start">
                <button
                    onClick={() => setSubTab('roots')}
                    className={`sub-nav-tab ${subTab === 'roots' ? 'active-roots' : ''}`}
                >
                    <Book size={18} /> Núcleos (Raíces)
                </button>
                <button
                    onClick={() => setSubTab('modifiers')}
                    className={`sub-nav-tab ${subTab === 'modifiers' ? 'active-modifiers' : ''}`}
                >
                    <Layers size={18} /> Morfología (Prefijos/Sufijos)
                </button>
                <button
                    onClick={() => setSubTab('categories')}
                    className={`sub-nav-tab ${subTab === 'categories' ? 'active-accent' : ''}`}
                >
                    <Tag size={18} /> Categorías
                </button>
            </div>

            <div className="animate-fade-in" key={subTab}>
                {subTab === 'roots' ? (
                    <RootManager roots={roots} setRoots={setRoots} categories={categories} />
                ) : subTab === 'modifiers' ? (
                    <ModifierManager
                        prefixes={prefixes} setPrefixes={setPrefixes}
                        suffixes={suffixes} setSuffixes={setSuffixes}
                    />
                ) : (
                    <CategoryManager categories={categories} />
                )}
            </div>
        </div>
    );
}
