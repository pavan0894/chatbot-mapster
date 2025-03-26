
/**
 * Debug utility functions for the application
 */

// Create a custom event listener that logs all events of a specific type
export function setupDebugEventListener(eventName: string): void {
  const originalAddEventListener = window.addEventListener;
  const originalDispatchEvent = window.dispatchEvent;
  
  console.log(`Setting up debug event listener for: ${eventName}`);
  
  window.addEventListener = function(type, listener, options) {
    if (type === eventName) {
      console.log(`Added event listener for ${eventName}`);
      const wrappedListener = function(this: any, event: Event) {
        console.log(`Event listener for ${eventName} triggered with data:`, 
          event instanceof CustomEvent ? event.detail : event);
        return (listener as EventListener).apply(this, [event]);
      };
      return originalAddEventListener.call(this, type, wrappedListener as EventListener, options);
    } else {
      return originalAddEventListener.call(this, type, listener, options);
    }
  };
  
  window.dispatchEvent = function(event) {
    if (event.type === eventName) {
      console.log(`Dispatching ${eventName} event with data:`, 
        event instanceof CustomEvent ? event.detail : event);
    }
    return originalDispatchEvent.call(this, event);
  };
}

// Log the current state of all location types being displayed
export function logVisibleLocationTypes(types: string[]): void {
  console.log(`Currently visible location types: ${types.join(', ') || 'none'}`);
}

// Verify an event was properly created
export function verifyEventCreation(eventName: string, data: any): CustomEvent<any> {
  console.log(`Creating ${eventName} event with data:`, data);
  const event = new CustomEvent(eventName, { detail: data });
  console.log(`Event created:`, event.type, event.detail);
  return event;
}
