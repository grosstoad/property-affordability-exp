import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { 
  INCOME_SHADING_RULES, 
  DEBT_SHADING_RULES, 
  IncomeRuleType, 
  DebtRuleType 
} from '@/utils/shadingRules';

// Define types for our state
type IncomeRulesState = typeof INCOME_SHADING_RULES;
type DebtRulesState = typeof DEBT_SHADING_RULES;

export function ShadingRulesAdmin() {
  const [incomeRules, setIncomeRules] = useState<IncomeRulesState>({ ...INCOME_SHADING_RULES });
  const [debtRules, setDebtRules] = useState<DebtRulesState>({ ...DEBT_SHADING_RULES });
  const [isEditing, setIsEditing] = useState(false);
  
  const handleIncomeRuleChange = (key: IncomeRuleType, value: number) => {
    setIncomeRules(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        percentage: value
      }
    }));
  };
  
  const handleDebtRuleChange = (key: DebtRuleType, value: number, isAmount = false) => {
    setDebtRules(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [isAmount ? 'amount' : 'percentage']: value
      }
    }));
  };
  
  const handleSave = () => {
    console.log('Income Rules:', incomeRules);
    console.log('Debt Rules:', debtRules);
    setIsEditing(false);
    alert('Rules saved! In a real app, these would be persisted.');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Shading Rules Configuration</h2>
        <Button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          variant={isEditing ? "default" : "outline"}
        >
          {isEditing ? "Save Changes" : "Edit Rules"}
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Income Shading Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.entries(incomeRules) as [IncomeRuleType, typeof incomeRules[IncomeRuleType]][]).map(([key, rule]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`income-${key}`}>{rule.description}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={`income-${key}`}
                    type="number"
                    value={rule.percentage}
                    onChange={(e) => handleIncomeRuleChange(key, parseFloat(e.target.value))}
                    disabled={!isEditing}
                  />
                  <span className="text-sm">%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Debt & Expense Shading Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.entries(debtRules) as [DebtRuleType, typeof debtRules[DebtRuleType]][]).map(([key, rule]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`debt-${key}`}>{rule.description}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={`debt-${key}`}
                    type="number"
                    value={'percentage' in rule ? rule.percentage : 'amount' in rule ? rule.amount : 0}
                    onChange={(e) => handleDebtRuleChange(
                      key, 
                      parseFloat(e.target.value), 
                      'amount' in rule
                    )}
                    disabled={!isEditing}
                  />
                  <span className="text-sm">{'percentage' in rule ? '%' : '$'}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 