import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Paperclip, X } from "lucide-react";

interface FileUploadProps {
  onFileUploaded: (fileUrl: string, fileName: string, fileType: string) => void;
  currentUserId: string;
}

export const FileUpload = ({ onFileUploaded, currentUserId }: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUserId}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('chat-files')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(fileName);

      onFileUploaded(publicUrl, file.name, file.type);

      toast({
        title: "File uploaded",
        description: "File uploaded successfully",
      });
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="h-8 w-8 p-0"
      >
        <Paperclip className="h-4 w-4" />
      </Button>
    </div>
  );
};

interface FileMessageProps {
  fileUrl: string;
  fileName: string;
  fileType: string;
}

export const FileMessage = ({ fileUrl, fileName, fileType }: FileMessageProps) => {
  const isImage = fileType.startsWith('image/');
  const isVideo = fileType.startsWith('video/');
  const isAudio = fileType.startsWith('audio/');

  if (isImage) {
    return (
      <div className="max-w-xs">
        <img
          src={fileUrl}
          alt={fileName}
          className="rounded-lg max-w-full h-auto cursor-pointer"
          onClick={() => window.open(fileUrl, '_blank')}
        />
        <p className="text-xs text-muted-foreground mt-1">{fileName}</p>
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="max-w-xs">
        <video
          src={fileUrl}
          controls
          className="rounded-lg max-w-full h-auto"
        />
        <p className="text-xs text-muted-foreground mt-1">{fileName}</p>
      </div>
    );
  }

  if (isAudio) {
    return (
      <div className="max-w-xs">
        <audio src={fileUrl} controls className="w-full" />
        <p className="text-xs text-muted-foreground mt-1">{fileName}</p>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.open(fileUrl, '_blank')}
      className="flex items-center gap-2"
    >
      <Paperclip className="h-4 w-4" />
      <span className="truncate max-w-40">{fileName}</span>
    </Button>
  );
};