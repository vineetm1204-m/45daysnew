'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Save, X, Plus } from 'lucide-react';

interface Question {
  id?: string;
  title: string;
  description: string;
  difficulty?: string;
  category?: string;
  tags?: string[];
  example?: string;
  constraints?: string;
}

interface QuestionsManagerProps {
  questions: Question[];
  onQuestionsUpdate: (questions: Question[]) => void;
  className?: string;
}

export default function QuestionsManager({ questions, onQuestionsUpdate, className = '' }: QuestionsManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Question>({
    title: '',
    description: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || question.difficulty?.toLowerCase() === filter;
    return matchesSearch && matchesFilter;
  });

  const startEdit = (question: Question) => {
    setEditingId(question.id || '');
    setEditForm({ ...question });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: '', description: '' });
  };

  const saveEdit = () => {
    const updatedQuestions = questions.map(q => 
      q.id === editingId ? { ...editForm } : q
    );
    onQuestionsUpdate(updatedQuestions);
    setEditingId(null);
    setEditForm({ title: '', description: '' });
  };

  const deleteQuestion = (id: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      const updatedQuestions = questions.filter(q => q.id !== id);
      onQuestionsUpdate(updatedQuestions);
    }
  };

  const addNewQuestion = () => {
    const newQuestion: Question = {
      id: `q_new_${Date.now()}`,
      title: 'New Question',
      description: 'Enter question description here...',
      difficulty: 'Easy',
      category: 'General',
      tags: []
    };
    onQuestionsUpdate([...questions, newQuestion]);
    startEdit(newQuestion);
  };

  const saveAllQuestions = async () => {
    try {
      const response = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions })
      });

      if (response.ok) {
        alert('Questions saved successfully!');
      } else {
        alert('Failed to save questions');
      }
    } catch (error) {
      alert('Error saving questions');
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'hard': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (questions.length === 0) {
    return (
      <Card className={`border-2 border-black bg-[#FED3A8] ${className}`}>
        <CardContent className="p-8 text-center">
          <p className="text-lg font-semibold text-gray-600">No questions available. Upload a file to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card className="border-2 border-black bg-[#FED3A8]">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2 font-bold text-black">
                Questions Manager ({questions.length} questions)
              </CardTitle>
              <CardDescription className="text-gray-700">
                Review, edit, and manage the extracted questions before saving them to the database.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={addNewQuestion}
                className="bg-green-600 hover:bg-green-700 text-white border-2 border-black"
              >
                <Plus size={16} className="mr-2" />
                Add Question
              </Button>
              <Button
                onClick={saveAllQuestions}
                className="bg-blue-600 hover:bg-blue-700 text-white border-2 border-black"
              >
                <Save size={16} className="mr-2" />
                Save All Questions
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <Input
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-64 border-2 border-black"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border-2 border-black rounded-md bg-white"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Questions List */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredQuestions.map((question, index) => (
              <Card key={question.id} className="border-2 border-black bg-white">
                <CardContent className="p-4">
                  {editingId === question.id ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <Input
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        placeholder="Question title"
                        className="font-semibold border-2 border-black"
                      />
                      <Textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Question description"
                        className="border-2 border-black"
                        rows={4}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-1">Difficulty</label>
                          <select
                            value={editForm.difficulty || ''}
                            onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value })}
                            className="w-full px-3 py-2 border-2 border-black rounded-md bg-white"
                          >
                            <option value="">Select...</option>
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-1">Category</label>
                          <Input
                            value={editForm.category || ''}
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                            placeholder="e.g., Array, String"
                            className="border-2 border-black"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-1">Tags (comma-separated)</label>
                          <Input
                            value={editForm.tags?.join(', ') || ''}
                            onChange={(e) => setEditForm({ 
                              ...editForm, 
                              tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                            })}
                            placeholder="e.g., hash table, two pointers"
                            className="border-2 border-black"
                          />
                        </div>
                      </div>
                      {editForm.example && (
                        <div>
                          <label className="block text-sm font-semibold mb-1">Example</label>
                          <Textarea
                            value={editForm.example}
                            onChange={(e) => setEditForm({ ...editForm, example: e.target.value })}
                            className="border-2 border-black"
                            rows={3}
                          />
                        </div>
                      )}
                      {editForm.constraints && (
                        <div>
                          <label className="block text-sm font-semibold mb-1">Constraints</label>
                          <Textarea
                            value={editForm.constraints}
                            onChange={(e) => setEditForm({ ...editForm, constraints: e.target.value })}
                            className="border-2 border-black"
                            rows={2}
                          />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button onClick={saveEdit} className="bg-green-600 hover:bg-green-700 text-white">
                          <Save size={16} className="mr-2" />
                          Save
                        </Button>
                        <Button onClick={cancelEdit} variant="outline" className="border-2 border-black">
                          <X size={16} className="mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg text-black">{question.title}</h3>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => startEdit(question)}
                            size="sm"
                            variant="outline"
                            className="border-2 border-black"
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            onClick={() => deleteQuestion(question.id || '')}
                            size="sm"
                            variant="outline"
                            className="border-2 border-red-500 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 text-sm">{question.description}</p>
                      
                      <div className="flex flex-wrap gap-2">
                        {question.difficulty && (
                          <Badge className={`border-2 ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty}
                          </Badge>
                        )}
                        {question.category && (
                          <Badge variant="outline" className="border-2 border-blue-300 text-blue-800">
                            {question.category}
                          </Badge>
                        )}
                        {question.tags?.map((tag, tagIndex) => (
                          <Badge 
                            key={tagIndex} 
                            variant="outline" 
                            className="border-2 border-gray-300 text-gray-600 text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {question.example && (
                        <details className="mt-2">
                          <summary className="cursor-pointer font-semibold text-sm text-gray-600">
                            Example
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 border border-gray-300 rounded text-xs overflow-x-auto">
                            {question.example}
                          </pre>
                        </details>
                      )}

                      {question.constraints && (
                        <details className="mt-2">
                          <summary className="cursor-pointer font-semibold text-sm text-gray-600">
                            Constraints
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 border border-gray-300 rounded text-xs">
                            {question.constraints}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
