import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Paperclip, X } from "lucide-react";

export const FileUpload = ({ onFileUploaded, currentUserId }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const handleFileSelect = async (event) => {
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
    } catch (error) {
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

export const FileMessage = ({ fileUrl, fileName, fileType }) => {
  const isImage = fileType.startsWith('image/');
  const isVideo = fileType.startsWith('video/');
  const isAudio = fileType.startsWith('audio/');

  return (
    <div className="file-message">
      {isImage && (
        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
          <img src={fileUrl} alt={fileName} className="max-w-full rounded-md mb-2" style={{ maxHeight: '200px' }} />
        </a>
      )}
      
      {isVideo && (
        <video controls className="max-w-full rounded-md mb-2" style={{ maxHeight: '200px' }}>
          <source src={fileUrl} type={fileType} />
          Your browser does not support the video tag.
        </video>
      )}
      
      {isAudio && (
        <audio controls className="max-w-full mb-2">
          <source src={fileUrl} type={fileType} />
          Your browser does not support the audio tag.
        </audio>
      )}
      
      {!isImage && !isVideo && !isAudio && (
        <div className="flex items-center space-x-2 p-2 bg-background rounded-md mb-2">
          <div className="flex-1 truncate">
            <a 
              href={fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {fileName}
            </a>
          </div>
        </div>
      )}
    </div>
  );
};