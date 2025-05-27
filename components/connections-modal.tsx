"use client";

import { useState } from "react";
import { X, Calendar, Plus, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import providers from "@/utils/providers";
import type { ConnectionsModalProps } from "@/utils/types";

export function ConnectionsModal({
  isOpen,
  onCloseAction,
}: ConnectionsModalProps) {
  const [connectedCalendars, setConnectedCalendars] = useState<string[]>([]);
  const [connectingCalendar, setConnectingCalendar] = useState<string | null>(
    null,
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(false);

  if (!isOpen) return null;

  const handleConnect = (providerId: string) => {
    setConnectingCalendar(providerId);
    setIsProviderDialogOpen(true);
  };

  const handleConfirmConnect = () => {
    setIsConnecting(true);

    setTimeout(() => {
      setIsConnecting(false);
      setShowSuccess(true);

      if (
        connectingCalendar &&
        !connectedCalendars.includes(connectingCalendar)
      ) {
        setConnectedCalendars([...connectedCalendars, connectingCalendar]);
      }

      setTimeout(() => {
        setShowSuccess(false);
        setIsProviderDialogOpen(false);
      }, 2000);
    }, 1500);
  };

  const handleDisconnect = (providerId: string) => {
    setConnectedCalendars(connectedCalendars.filter((id) => id !== providerId));
  };

  const closeProviderDialog = () => {
    setIsProviderDialogOpen(false);
    setConnectingCalendar(null);
    setShowSuccess(false);
  };

  const provider = providers.find((p) => p.id === connectingCalendar);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white/10 dark:bg-black/30 backdrop-blur-lg border border-white/20 rounded-xl shadow-xl w-full max-w-3xl mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <h2 className="text-xl font-semibold text-foreground">
            Calendar Connections
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCloseAction}
            className="text-foreground hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Connected Calendars
              </h3>
              <p className="text-muted-foreground mb-4">
                Manage your connected calendar accounts and services.
              </p>

              {connectedCalendars.length === 0 ? (
                <Card className="bg-white/10 dark:bg-black/20 backdrop-blur-sm border-white/20">
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      No calendars connected yet. Connect a calendar to sync
                      your events.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {connectedCalendars.map((id) => {
                    const provider = providers.find((p) => p.id === id);
                    if (!provider) return null;

                    return (
                      <Card
                        key={id}
                        className="bg-white/10 dark:bg-black/20 backdrop-blur-sm border-white/20"
                      >
                        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                          <div className="flex items-center space-x-4 flex-1">
                            <div
                              className={`aspect-square w-10 h-10 rounded-full flex items-center justify-center ${provider.color}`}
                            >
                              {provider.icon && (
                                <provider.icon className="w-6 h-6 text-white" />
                              )}
                            </div>
                            <div>
                              <CardTitle className="text-base text-foreground">
                                {provider.name}
                              </CardTitle>
                              <CardDescription>Connected</CardDescription>
                            </div>
                          </div>
                          <Badge variant="outline" className="ml-auto">
                            Active
                          </Badge>
                        </CardHeader>
                        <CardFooter className="pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-auto text-destructive hover:text-destructive border-white/20"
                            onClick={() => handleDisconnect(id)}
                          >
                            Disconnect
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator className="bg-white/20" />

            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Available Connections
              </h3>
              <p className="text-muted-foreground mb-4">
                Connect to these calendar services to sync your events.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {providers
                  .filter(
                    (provider) => !connectedCalendars.includes(provider.id),
                  )
                  .map((provider) => (
                    <Card
                      key={provider.id}
                      className="bg-white/10 dark:bg-black/20 backdrop-blur-sm border-white/20"
                    >
                      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                        <div
                          className={`aspect-square w-10 h-10 rounded-full flex items-center justify-center ${provider.color}`}
                        >
                          {provider.icon && (
                            <provider.icon className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div className="ml-4">
                          <CardTitle className="text-base text-foreground">
                            {provider.name}
                          </CardTitle>
                          <CardDescription>
                            {provider.description}
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardFooter className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-auto border-white/20"
                          onClick={() => handleConnect(provider.id)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Connect
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-white/20">
          <Button
            onClick={onCloseAction}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Done
          </Button>
        </div>
      </div>

      {/* Provider Connection Dialog */}
      <Dialog
        open={isProviderDialogOpen}
        onOpenChange={setIsProviderDialogOpen}
      >
        <DialogContent className="bg-white/10 dark:bg-black/30 backdrop-blur-lg border border-white/20 text-foreground">
          {showSuccess ? (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                Successfully Connected
              </h2>
              <p className="text-center text-muted-foreground">
                Your {provider?.name} account has been connected successfully.
              </p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Connect to {provider?.name}</DialogTitle>
                <DialogDescription>
                  Enter your credentials to connect your {provider?.name}{" "}
                  account.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {provider?.id === "caldav" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="server-url">CalDAV Server URL</Label>
                      <Input
                        id="server-url"
                        placeholder="https://example.com/caldav/"
                        className="bg-white/10 border-white/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        className="bg-white/10 border-white/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        className="bg-white/10 border-white/20"
                      />
                    </div>
                  </>
                ) : (
                  <div className="rounded-md bg-white/5 p-4">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">
                          Authorization Required
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          You'll be redirected to {provider?.name} to authorize
                          access to your calendar.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={closeProviderDialog}
                  disabled={isConnecting}
                  className="border-white/20"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmConnect}
                  disabled={isConnecting}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {isConnecting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Connecting...
                    </>
                  ) : (
                    "Connect"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
