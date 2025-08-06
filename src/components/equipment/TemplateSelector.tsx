'use client';

import React from 'react';
import { ItemType } from '@/types/equipment';

interface TemplateSelectorProps {
  templates: ItemType[];
  selectedTemplate: ItemType | null;
  onSelect: (template: ItemType) => void;
  error?: string;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  selectedTemplate,
  onSelect,
  error
}) => {
  // Group templates by category for better organization
  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, ItemType[]>);

  const getCategoryIcon = (category: string): string => {
    const iconMap: Record<string, string> = {
      radio: '📻',
      optics: '🔍',
      extraction_gear: '🪢',
      weapons: '🔫',
      protective_gear: '🛡️',
      communication: '📡',
      navigation: '🧭',
      medical: '🏥',
      tools: '🔧',
      general: '📦'
    };
    return iconMap[category] || '📦';
  };

  const getAssignmentTypeColor = (assignmentType: 'team' | 'personal'): string => {
    return assignmentType === 'personal' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-purple-100 text-purple-800';
  };

  if (templates.length === 0) {
    return (
      <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
        <div className="text-gray-500 text-lg mb-2">📦</div>
        <p className="text-gray-600">No equipment templates available</p>
        <p className="text-sm text-gray-500 mt-1">
          Please ensure the itemTypes collection has been seeded with templates.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${error ? 'border-red-500' : ''}`}>
      {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
        <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Category Header */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="font-medium text-gray-900 flex items-center">
              <span className="mr-2">{getCategoryIcon(category)}</span>
              <span className="capitalize">{category.replace('_', ' ')}</span>
              <span className="ml-2 text-sm text-gray-500">
                ({categoryTemplates.length} template{categoryTemplates.length !== 1 ? 's' : ''})
              </span>
            </h3>
          </div>

          {/* Templates in Category */}
          <div className="divide-y divide-gray-200">
            {categoryTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => onSelect(template)}
                className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedTemplate?.id === template.id 
                    ? 'bg-blue-50 border-l-4 border-blue-500' 
                    : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Template Title */}
                    <div className="flex items-center mb-2">
                      <h4 className="font-medium text-gray-900">
                        {template.manufacturer} {template.model}
                      </h4>
                      <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${getAssignmentTypeColor(template.assignmentType)}`}>
                        {template.assignmentType}
                      </span>
                    </div>

                    {/* Template Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">ID:</span>
                        <span className="ml-1 font-mono text-xs">{template.id}</span>
                      </div>
                      <div>
                        <span className="font-medium">Depot:</span>
                        <span className="ml-1">{template.defaultDepot}</span>
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>
                        <span className="ml-1">{template.defaultStatus}</span>
                      </div>
                    </div>

                    {/* Image URL if available */}
                    {template.defaultImageUrl && (
                      <div className="mt-2 text-sm text-gray-500">
                        <span className="font-medium">Image:</span>
                        <span className="ml-1 truncate">{template.defaultImageUrl}</span>
                      </div>
                    )}
                  </div>

                  {/* Selection Indicator */}
                  <div className="ml-4 flex-shrink-0">
                    {selectedTemplate?.id === template.id ? (
                      <div className="flex items-center justify-center w-6 h-6 bg-blue-600 rounded-full">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}

      {/* Selection Summary */}
      {selectedTemplate && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="text-blue-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-blue-800 font-medium">
                Selected: {selectedTemplate.manufacturer} {selectedTemplate.model}
              </p>
              <p className="text-blue-700 text-sm">
                Template fields will be pre-filled in the form below
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-600">
          💡 <strong>Tip:</strong> Select a template to pre-fill equipment details. 
          You can modify the depot and status fields if needed, but core template information 
          (category, model, manufacturer) will be inherited from the selected template.
        </p>
      </div>
    </div>
  );
};

export default TemplateSelector;