import { createContext, useContext, useState } from "react";
import Alert from "../components/ui/Alert";

const AlertContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  const showAlert = (message, type = "error") => {
    const id = Date.now();

    setAlerts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }, 3000);
  };

  const removeAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      
      {children}

      {/* Alert Stack */}
      <div className="fixed top-5 right-5 space-y-3 z-50">
        {alerts.map((alert) => (
          <Alert
            key={alert.id}
            message={alert.message}
            type={alert.type}
            onClose={() => removeAlert(alert.id)}
          />
        ))}
      </div>

    </AlertContext.Provider>
  );
};