import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const filename = file.name.toLowerCase();
    let questions: Question[] = [];

    if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      // Handle Excel files
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      questions = parseSpreadsheetData(jsonData as any[][]);
      
    } else if (filename.endsWith('.csv')) {
      // Handle CSV files
      const text = new TextDecoder().decode(buffer);
      const parsed = Papa.parse(text, { header: false });
      questions = parseSpreadsheetData(parsed.data as string[][]);
      
    } else {
      return NextResponse.json({ error: 'Unsupported file format. Please upload CSV or XLSX files.' }, { status: 400 });
    }

    if (questions.length === 0) {
      return NextResponse.json({ error: 'No valid questions found in the file' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      questions: questions,
      count: questions.length 
    });

  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
  }
}

function parseSpreadsheetData(data: any[][]): Question[] {
  if (!data || data.length < 2) return [];

  const headers = data[0].map((h: any) => String(h).toLowerCase().trim());
  const questions: Question[] = [];

  // Map common header variations to standard fields
  const fieldMapping: { [key: string]: string } = {
    'title': 'title',
    'question': 'title',
    'problem': 'title',
    'name': 'title',
    'description': 'description',
    'desc': 'description',
    'details': 'description',
    'problem statement': 'description',
    'difficulty': 'difficulty',
    'level': 'difficulty',
    'category': 'category',
    'topic': 'category',
    'tags': 'tags',
    'tag': 'tags',
    'example': 'example',
    'examples': 'example',
    'constraints': 'constraints',
    'constraint': 'constraints'
  };

  // Find column indices for each field
  const columnMap: { [key: string]: number } = {};
  headers.forEach((header, index) => {
    const standardField = fieldMapping[header];
    if (standardField) {
      columnMap[standardField] = index;
    }
  });

  // Process each row (skip header row)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const question: Question = {
      title: '',
      description: ''
    };

    // Extract data based on column mapping
    if (columnMap.title !== undefined) {
      question.title = String(row[columnMap.title] || '').trim();
    }
    if (columnMap.description !== undefined) {
      question.description = String(row[columnMap.description] || '').trim();
    }
    if (columnMap.difficulty !== undefined) {
      question.difficulty = String(row[columnMap.difficulty] || '').trim();
    }
    if (columnMap.category !== undefined) {
      question.category = String(row[columnMap.category] || '').trim();
    }
    if (columnMap.example !== undefined) {
      question.example = String(row[columnMap.example] || '').trim();
    }
    if (columnMap.constraints !== undefined) {
      question.constraints = String(row[columnMap.constraints] || '').trim();
    }
    if (columnMap.tags !== undefined) {
      const tagsValue = String(row[columnMap.tags] || '').trim();
      question.tags = tagsValue ? tagsValue.split(',').map(tag => tag.trim()) : [];
    }

    // Generate ID if not provided
    question.id = `q_${Date.now()}_${i}`;

    // Only add questions with both title and description
    if (question.title && question.description) {
      questions.push(question);
    }
  }

  return questions;
}
