import React from 'react';
import { Database } from '@phosphor-icons/react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 mt-16">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Database size={16} className="text-primary" />
              <span>Source des données :</span>
              <a 
                href="https://www.prix-carburants.gouv.fr/rubrique/opendata/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 underline font-medium"
              >
                prix-carburants.gouv.fr
              </a>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4 text-xs">
            <div>
              Données officielles du Ministère de l'Économie, des Finances et de la Souveraineté industrielle et numérique
            </div>
            <div className="flex items-center gap-1">
              <span>•</span>
              <span>Mise à jour en temps réel</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground/70 text-center">
            <p>
              Données sous licence libre • 
              <a 
                href="https://github.com/etalab/licence-ouverte" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 underline ml-1"
              >
                Licence Ouverte / Open Licence
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}