'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react';

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

interface FileUploadProps {
  onQuestionsExtracted: (questions: Question[]) => void;
  className?: string;
}

export default function FileUpload({ onQuestionsExtracted, className = '' }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [extractedQuestions, setExtractedQuestions] = useState<Question[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('idle');
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/admin/upload-questions', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Upload error response:', text);
        setUploadStatus('error');
        setMessage('Failed to upload file - server error');
        return;
      }

      const result = await response.json();

      if (response.ok) {
        setUploadStatus('success');
        setMessage(`Successfully extracted ${result.count} questions from ${file.name}`);
        setExtractedQuestions(result.questions);
        onQuestionsExtracted(result.questions);
      } else {
        setUploadStatus('error');
        setMessage(result.error || 'Failed to process file');
      }
    } catch (error) {
      setUploadStatus('error');
      setMessage('An error occurred while uploading the file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
        handleFileUpload({ target: { files: dataTransfer.files } } as any);
      }
    }
  };

  const downloadTemplate = () => {
    const template = [
      ['Title', 'Description', 'Difficulty', 'Category', 'Tags', 'Example', 'Constraints'],
      [
        'Two Sum', 
        'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        'Easy',
        'Array',
        'Array, Hash Table',
        'Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]',
        '2 <= nums.length <= 10^4'
      ],
      [
        'Add Two Numbers',
        'You are given two non-empty linked lists representing two non-negative integers.',
        'Medium',
        'Linked List',
        'Linked List, Math',
        'Input: l1 = [2,4,3], l2 = [5,6,4]\nOutput: [7,0,8]',
        '1 <= listSize <= 100'
      ]
    ];

    const csvContent = template.map(row => 
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className={className}>
      <Card className="border-2 border-black bg-[#FED3A8]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-bold text-black">
            <Upload size={24} />
            Upload Questions File
          </CardTitle>
          <CardDescription className="text-gray-700">
            Upload a CSV or XLSX file containing coding questions. The file should have columns for Title, Description, Difficulty, Category, etc.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Download Template Button */}
          <Button
            onClick={downloadTemplate}
            variant="outline"
            className="w-full border-2 border-black bg-white hover:bg-gray-50"
          >
            <Download size={16} className="mr-2" />
            Download Template File
          </Button>

          {/* File Upload Area */}
          <div
            className="border-2 border-dashed border-black rounded-lg p-8 text-center cursor-pointer hover:bg-[#FF7D21]/10 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <FileText size={48} className="mx-auto mb-4 text-gray-600" />
            
            {isUploading ? (
              <div className="space-y-2">
                <div className="animate-spin w-6 h-6 border-2 border-black border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm font-semibold">Processing file...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-lg font-semibold text-black">
                  Drop your file here or click to browse
                </p>
                <p className="text-sm text-gray-600">
                  Supported formats: CSV, XLSX, XLS
                </p>
              </div>
            )}
          </div>

          {/* Status Message */}
          {message && (
            <div className={`flex items-center gap-2 p-3 rounded-md border-2 border-black ${
              uploadStatus === 'success' ? 'bg-green-100 text-green-800' :
              uploadStatus === 'error' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {uploadStatus === 'success' && <CheckCircle size={20} />}
              {uploadStatus === 'error' && <AlertCircle size={20} />}
              <span className="font-semibold">{message}</span>
            </div>
          )}

          {/* Questions Preview */}
          {extractedQuestions.length > 0 && (
            <div className="mt-6">
              <h3 className="font-bold text-lg mb-3 text-black">Extracted Questions Preview</h3>
              <div className="max-h-64 overflow-y-auto space-y-2 bg-white border-2 border-black rounded-md p-4">
                {extractedQuestions.slice(0, 5).map((question, index) => (
                  <div key={index} className="border-b border-gray-200 pb-2 last:border-b-0">
                    <h4 className="font-semibold text-black">{question.title}</h4>
                    <p className="text-sm text-gray-600 truncate">{question.description}</p>
                    {question.difficulty && (
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold mt-1 ${
                        question.difficulty.toLowerCase() === 'easy' ? 'bg-green-100 text-green-800' :
                        question.difficulty.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {question.difficulty}
                      </span>
                    )}
                  </div>
                ))}
                {extractedQuestions.length > 5 && (
                  <p className="text-sm text-gray-500 italic">
                    ... and {extractedQuestions.length - 5} more questions
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
