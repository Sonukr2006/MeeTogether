import { useEffect } from "react";
import { X, CheckCircle, AlertTriangle, Info } from "lucide-react";

const icons = {
  success: <CheckCircle className="text-green-400" size={20} />,
  error: <AlertTriangle className="text-red-400" size={20} />,
  warning: <AlertTriangle className="text-yellow-400" size={20} />,
  info: <Info className="text-blue-400" size={20} />,
};

const colors = {
  success: "border-green-500/30",
  error: "border-red-500/30",
  warning: "border-yellow-500/30",
  info: "border-blue-500/30",
};

const dotColors = {
  success: "bg-green-400",
  error: "bg-red-500",
  warning: "bg-yellow-400",
  info: "bg-blue-400",
};

const Alert = ({ message, type = "error", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl bg-[#1e293b] border ${colors[type]} shadow-lg w-[320px] animate-slideIn`}>
      
      {/* Dot indicator */}
      <div className={`w-2 h-2 mt-2 rounded-full ${dotColors[type]}`}></div>

      {/* Icon */}
      {icons[type]}

      {/* Message */}
      <p className="text-gray-200 text-sm flex-1">{message}</p>

      {/* Close */}
      <button onClick={onClose} className="text-gray-400 hover:text-white">
        <X size={16} />
      </button>
    </div>
  );
};

export default Alert;