'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function CodeOfChoicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [description, setDescription] = useState('');
  const [codeFile, setCodeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCodeFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // In a real application, you would upload the file and description to your backend
      // For now, we'll just show a success message
      toast({
        title: 'Success',
        description: 'Your code has been submitted successfully!',
      });
      
      // Redirect back to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit your code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Theme colors from dashboard
  const baseBg = '#FED3A8';
  const orange = '#FF7D21';
  const cream = '#FED3A8';

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: baseBg }}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div 
            className="rounded-md border p-8 relative w-full"
            style={{ backgroundColor: orange, borderColor: '#000' }}
          >
            <h1 
              className="text-3xl font-bold mb-6 tracking-wide text-center"
              style={{ color: '#3A2A18', fontFamily: 'var(--font-jura)' }}
            >
              Enter Code of Your Choice
            </h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label 
                  className="block text-lg font-semibold mb-2"
                  style={{ color: '#3A2A18', fontFamily: 'var(--font-jura)' }}
                >
                  Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your code..."
                  className="w-full min-h-[120px] p-4 rounded-md border-2 border-black"
                  style={{ backgroundColor: cream, color: '#2A1C0E' }}
                  required
                />
              </div>
              
              <div>
                <label 
                  className="block text-lg font-semibold mb-2"
                  style={{ color: '#3A2A18', fontFamily: 'var(--font-jura)' }}
                >
                  Upload Code File
                </label>
                <Input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full p-4 rounded-md border-2 border-black"
                  style={{ backgroundColor: cream, color: '#2A1C0E' }}
                  required
                />
                <p className="text-sm mt-2" style={{ color: '#3A2A18' }}>
                  Upload your code file (any programming language)
                </p>
              </div>
              
              <div className="flex justify-between items-center pt-4">
                <Button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 rounded-lg border-2 border-black hover:opacity-90 transition-all duration-200 font-bold"
                  style={{ 
                    backgroundColor: '#FF7D21', 
                    color: '#FED3A8',
                    fontFamily: 'var(--font-jura)'
                  }}
                >
                  Back
                </Button>
                
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-lg border-2 border-black hover:opacity-90 transition-all duration-200 font-bold"
                  style={{ 
                    backgroundColor: '#000', 
                    color: '#FED3A8',
                    fontFamily: 'var(--font-jura)'
                  }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Code'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
