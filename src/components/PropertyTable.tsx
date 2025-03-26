
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LocationWithCoordinates } from '@/utils/mapUtils';
import { LOCATION_QUERY_EVENT, LocationQuery } from './Chatbot';
import { MAP_RESULTS_UPDATE_EVENT } from './Map';

interface PropertyTableProps {
  className?: string;
}

const PropertyTable: React.FC<PropertyTableProps> = ({ className = '' }) => {
  const [properties, setProperties] = useState<LocationWithCoordinates[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');

  useEffect(() => {
    console.log("PropertyTable: Setting up event listeners");
    
    // Listen for location query events to show loading state
    const handleLocationQuery = (e: CustomEvent<LocationQuery>) => {
      const query = e.detail;
      console.log("PropertyTable received location query:", query);
      setQuery(`${query.source}${query.target ? ` near ${query.target}` : ''} within ${query.radius} miles`);
      setIsLoading(true);
      
      // Reset properties to avoid showing old results during loading
      setProperties([]);
    };

    // Results update event listener
    const handleResultsUpdate = (e: CustomEvent<{properties: LocationWithCoordinates[]}>) => {
      console.log("PropertyTable received results update event:", e.detail);
      
      if (e.detail && Array.isArray(e.detail.properties)) {
        console.log("PropertyTable setting properties:", e.detail.properties.length);
        setProperties(e.detail.properties);
      } else {
        console.error("PropertyTable received invalid results update event:", e.detail);
        setProperties([]);
      }
      
      setIsLoading(false);
    };
    
    // Add event listeners with proper type casting
    window.addEventListener(LOCATION_QUERY_EVENT, handleLocationQuery as EventListener);
    window.addEventListener(MAP_RESULTS_UPDATE_EVENT, handleResultsUpdate as EventListener);
    
    // Cleanup event listeners
    return () => {
      console.log("PropertyTable: Removing event listeners");
      window.removeEventListener(LOCATION_QUERY_EVENT, handleLocationQuery as EventListener);
      window.removeEventListener(MAP_RESULTS_UPDATE_EVENT, handleResultsUpdate as EventListener);
    };
  }, []);

  // Debug properties state changes
  useEffect(() => {
    console.log("PropertyTable properties updated:", properties.length);
  }, [properties]);

  return (
    <div className={`p-4 border-t border-border ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Property Results</h2>
        {query && <span className="text-sm text-muted-foreground">Showing: {query}</span>}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span className="ml-2 text-sm text-muted-foreground">Loading results...</span>
        </div>
      ) : (
        <Table>
          <TableCaption>
            {properties.length > 0 
              ? `${properties.length} properties found` 
              : "No properties to display. Try a location query in the chat."}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Coordinates</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.map((property, index) => (
              <TableRow key={`${property.name}-${index}`}>
                <TableCell className="font-medium">{property.name}</TableCell>
                <TableCell>{property.description}</TableCell>
                <TableCell>
                  {Array.isArray(property.coordinates) && property.coordinates.length >= 2
                    ? `${property.coordinates[1].toFixed(4)}, ${property.coordinates[0].toFixed(4)}`
                    : 'Invalid coordinates'}
                </TableCell>
              </TableRow>
            ))}
            {properties.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  No properties to display. Try a location query in the chat.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default PropertyTable;
