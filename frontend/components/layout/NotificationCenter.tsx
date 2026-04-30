import { useState } from "react";
import { Button } from "../ui/button";

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications] = useState<Array<{ id: string; message: string; time: string }>>([]);

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size="sm"
        className="relative"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {notifications.length}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-slate-700 bg-[#0B0F19] shadow-xl">
          <div className="border-b border-slate-700 p-4">
            <h3 className="font-semibold text-white">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <p>No notifications</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-700">
                {notifications.map((notification) => (
                  <li key={notification.id} className="p-4 hover:bg-slate-800/50">
                    <p className="text-sm text-white">{notification.message}</p>
                    <p className="mt-1 text-xs text-slate-400">{notification.time}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
