import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  INCOME_SHADING_RULES, 
  DEBT_SHADING_RULES, 
  IncomeRuleType, 
  DebtRuleType 
} from '@/utils/shadingRules';

// Define types for our state
type IncomeRulesState = typeof INCOME_SHADING_RULES;
type DebtRulesState = typeof DEBT_SHADING_RULES;

export function ShadingRulesSheet() {
  const [incomeRules, setIncomeRules] = useState<IncomeRulesState>({ ...INCOME_SHADING_RULES });
  const [debtRules, setDebtRules] = useState<DebtRulesState>({ ...DEBT_SHADING_RULES });
  const [isEditing, setIsEditing] = useState(false);
  
  const handleSave = () => {
    console.log('Income Rules:', incomeRules);
    console.log('Debt Rules:', debtRules);
    setIsEditing(false);
    alert('Rules saved! In a real app, these would be persisted.');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Shading Rules Sheet</h2>
        <Button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          variant={isEditing ? "default" : "outline"}
        >
          {isEditing ? "Save Changes" : "Edit Rules"}
        </Button>
      </div>
      
      <div className="border rounded-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rule Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Income Rules */}
            <tr className="bg-gray-100">
              <td colSpan={4} className="px-6 py-2 text-sm font-medium">Income Shading Rules</td>
            </tr>
            {(Object.entries(incomeRules) as [IncomeRuleType, typeof incomeRules[IncomeRuleType]][]).map(([key, rule]) => (
              <tr key={`income-${key}`}>
                <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{key}</td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">{rule.description}</td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                  {isEditing ? (
                    <Input
                      type="number"
                      value={rule.percentage}
                      onChange={(e) => {
                        setIncomeRules(prev => ({
                          ...prev,
                          [key]: {
                            ...prev[key],
                            percentage: parseFloat(e.target.value)
                          }
                        }));
                      }}
                      className="w-24 h-8"
                    />
                  ) : rule.percentage}
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">%</td>
              </tr>
            ))}
            
            {/* Debt Rules */}
            <tr className="bg-gray-100">
              <td colSpan={4} className="px-6 py-2 text-sm font-medium">Debt & Expense Shading Rules</td>
            </tr>
            {(Object.entries(debtRules) as [DebtRuleType, typeof debtRules[DebtRuleType]][]).map(([key, rule]) => (
              <tr key={`debt-${key}`}>
                <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{key}</td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">{rule.description}</td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                  {isEditing ? (
                    <Input
                      type="number"
                      value={'percentage' in rule ? rule.percentage : 'amount' in rule ? rule.amount : 0}
                      onChange={(e) => {
                        setDebtRules(prev => ({
                          ...prev,
                          [key]: {
                            ...prev[key],
                            [('percentage' in rule) ? 'percentage' : 'amount']: parseFloat(e.target.value)
                          }
                        }));
                      }}
                      className="w-24 h-8"
                    />
                  ) : ('percentage' in rule ? rule.percentage : 'amount' in rule ? rule.amount : 0)}
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                  {'percentage' in rule ? '%' : '$'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 