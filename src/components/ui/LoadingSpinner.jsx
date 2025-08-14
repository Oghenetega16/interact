export default function LoadingSpinner({ size = "md", text = "Loading...", className = "" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div 
        className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
      {text && (
        <p className="mt-2 text-sm text-gray-600 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}

// Alternative dot spinner variant
export function DotSpinner({ className = "" }) {
  return (
    <div className={`flex space-x-1 ${className}`}>
      <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce"></div>
      <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
      <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
    </div>
  );
}

// Inline spinner for buttons
export function ButtonSpinner({ className = "" }) {
  return (
    <div 
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent ${className}`}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Full page spinner
export function PageSpinner({ text = "Loading application..." }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" text={text} />
      </div>
    </div>
  );
}