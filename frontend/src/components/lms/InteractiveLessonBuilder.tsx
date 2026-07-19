
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Video, FileText, Code, HelpCircle } from 'lucide-react';

interface ContentBlock {
  id: string;
  type: 'text' | 'video' | 'quiz' | 'exercise' | 'multimedia';
  title: string;
  content: any;
  order: number;
}

interface InteractiveLessonBuilderProps {
  lessonId?: string;
  onSave: (blocks: ContentBlock[]) => void;
  onCancel: () => void;
}

export const InteractiveLessonBuilder: React.FC<InteractiveLessonBuilderProps> = ({
  lessonId,
  onSave,
  onCancel
}) => {
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [activeBlock, setActiveBlock] = useState<string | null>(null);

  const addContentBlock = (type: ContentBlock['type']) => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type,
      title: `New ${type} block`,
      content: getDefaultContent(type),
      order: contentBlocks.length
    };
    setContentBlocks(prev => [...prev, newBlock]);
    setActiveBlock(newBlock.id);
  };

  const getDefaultContent = (type: ContentBlock['type']) => {
    switch (type) {
      case 'text':
        return { text: '' };
      case 'video':
        return { url: '', duration: 0, transcription: '' };
      case 'quiz':
        return {
          questions: [],
          timeLimit: null,
          passingScore: 70
        };
      case 'exercise':
        return {
          difficulty: 'beginner',
          estimatedTime: 30,
          steps: []
        };
      case 'multimedia':
        return { items: [] };
      default:
        return {};
    }
  };

  const updateContentBlock = (id: string, updates: Partial<ContentBlock>) => {
    setContentBlocks(prev =>
      prev.map(block => block.id === id ? { ...block, ...updates } : block)
    );
  };

  const removeContentBlock = (id: string) => {
    setContentBlocks(prev => prev.filter(block => block.id !== id));
    if (activeBlock === id) {
      setActiveBlock(null);
    }
  };

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    setContentBlocks(prev => {
      const blocks = [...prev];
      const index = blocks.findIndex(block => block.id === id);
      if (index === -1) return blocks;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= blocks.length) return blocks;

      [blocks[index], blocks[newIndex]] = [blocks[newIndex], blocks[index]];
      
      // Update order
      return blocks.map((block, i) => ({ ...block, order: i }));
    });
  };

  const renderBlockEditor = (block: ContentBlock) => {
    switch (block.type) {
      case 'text':
        return (
          <div className="space-y-4">
            <Input
              value={block.title}
              onChange={(e) => updateContentBlock(block.id, { title: e.target.value })}
              placeholder="Block title"
            />
            <Textarea
              value={block.content.text || ''}
              onChange={(e) => updateContentBlock(block.id, {
                content: { ...block.content, text: e.target.value }
              })}
              placeholder="Enter your text content here..."
              rows={10}
            />
          </div>
        );

      case 'video':
        return (
          <div className="space-y-4">
            <Input
              value={block.title}
              onChange={(e) => updateContentBlock(block.id, { title: e.target.value })}
              placeholder="Video title"
            />
            <Input
              value={block.content.url || ''}
              onChange={(e) => updateContentBlock(block.id, {
                content: { ...block.content, url: e.target.value }
              })}
              placeholder="Video URL"
            />
            <Input
              type="number"
              value={block.content.duration || ''}
              onChange={(e) => updateContentBlock(block.id, {
                content: { ...block.content, duration: parseInt(e.target.value) || 0 }
              })}
              placeholder="Duration (seconds)"
            />
            <Textarea
              value={block.content.transcription || ''}
              onChange={(e) => updateContentBlock(block.id, {
                content: { ...block.content, transcription: e.target.value }
              })}
              placeholder="Video transcription (optional)"
              rows={5}
            />
          </div>
        );

      case 'quiz':
        return (
          <div className="space-y-4">
            <Input
              value={block.title}
              onChange={(e) => updateContentBlock(block.id, { title: e.target.value })}
              placeholder="Quiz title"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                value={block.content.timeLimit || ''}
                onChange={(e) => updateContentBlock(block.id, {
                  content: { ...block.content, timeLimit: parseInt(e.target.value) || null }
                })}
                placeholder="Time limit (minutes)"
              />
              <Input
                type="number"
                value={block.content.passingScore || 70}
                onChange={(e) => updateContentBlock(block.id, {
                  content: { ...block.content, passingScore: parseInt(e.target.value) || 70 }
                })}
                placeholder="Passing score (%)"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Questions will be added in the advanced quiz builder (coming soon)
            </div>
          </div>
        );

      case 'exercise':
        return (
          <div className="space-y-4">
            <Input
              value={block.title}
              onChange={(e) => updateContentBlock(block.id, { title: e.target.value })}
              placeholder="Exercise title"
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                value={block.content.difficulty || 'beginner'}
                onValueChange={(value) => updateContentBlock(block.id, {
                  content: { ...block.content, difficulty: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={block.content.estimatedTime || 30}
                onChange={(e) => updateContentBlock(block.id, {
                  content: { ...block.content, estimatedTime: parseInt(e.target.value) || 30 }
                })}
                placeholder="Estimated time (minutes)"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Exercise steps will be configured in the advanced exercise builder (coming soon)
            </div>
          </div>
        );

      default:
        return <div>Content editor not implemented for this type</div>;
    }
  };

  const getBlockIcon = (type: ContentBlock['type']) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'quiz': return <HelpCircle className="h-4 w-4" />;
      case 'exercise': return <Code className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interactive Lesson Builder</CardTitle>
        <CardDescription>
          Create engaging lessons with interactive content blocks
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Content blocks list */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Content Blocks</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addContentBlock('text')}
                >
                  <FileText className="h-4 w-4 me-2" />
                  Text
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addContentBlock('video')}
                >
                  <Video className="h-4 w-4 me-2" />
                  Video
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addContentBlock('quiz')}
                >
                  <HelpCircle className="h-4 w-4 me-2" />
                  Quiz
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addContentBlock('exercise')}
                >
                  <Code className="h-4 w-4 me-2" />
                  Exercise
                </Button>
              </div>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {contentBlocks.map((block, index) => (
                <div
                  key={block.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    activeBlock === block.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setActiveBlock(block.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getBlockIcon(block.type)}
                      <div>
                        <div className="font-medium text-sm">{block.title}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {block.type}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveBlock(block.id, 'up');
                        }}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveBlock(block.id, 'down');
                        }}
                        disabled={index === contentBlocks.length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeContentBlock(block.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Block editor */}
          <div className="lg:col-span-2">
            {activeBlock ? (
              <div className="space-y-4">
                <h3 className="font-semibold">Edit Content Block</h3>
                {(() => {
                  const block = contentBlocks.find(b => b.id === activeBlock);
                  return block ? renderBlockEditor(block) : null;
                })()}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                Select a content block to edit, or add a new one to get started
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onSave(contentBlocks)}>
            Save Lesson
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
