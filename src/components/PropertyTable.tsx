
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LocationWithCoordinates } from '@/utils/mapUtils';
import { LOCATION_QUERY_EVENT, LocationQuery } from './Chatbot';

interface PropertyTableProps {
  className?: string;
}

const PropertyTable: React.FC<PropertyTableProps> = ({ className = '' }) => {
  const [properties, setProperties] = useState<LocationWithCoordinates[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');

  // Listen for location query events
  useEffect(() => {
    const handleLocationQuery = (e: CustomEvent<LocationQuery>) => {
      const query = e.detail;
      setQuery(`${query.source}${query.target ? ` near ${query.target}` : ''} within ${query.radius} miles`);
      setIsLoading(true);
    };

    window.addEventListener(LOCATION_QUERY_EVENT, handleLocationQuery as EventListener);
    
    // Custom event for receiving results from the map
    const handleResultsUpdate = (e: CustomEvent<{properties: LocationWithCoordinates[]}>) => {
      setProperties(e.detail.properties);
      setIsLoading(false);
    };
    
    window.addEventListener('map-results-update', handleResultsUpdate as EventListener);
    
    return () => {
      window.removeEventListener(LOCATION_QUERY_EVENT, handleLocationQuery as EventListener);
      window.removeEventListener('map-results-update', handleResultsUpdate as EventListener);
    };
  }, []);

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
            {properties.length === 0 && (
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
