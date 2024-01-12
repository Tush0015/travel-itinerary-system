import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from 'azle';
import { v4 as uuidv4 } from 'uuid';

// Define the type for a travel itinerary
type TravelItinerary = Record<{
    id: string;
    destination: string;
    startDate: nat64;
    endDate: nat64;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
}>

// Define the type for the payload used in creating or updating a travel itinerary
type TravelItineraryPayload = Record<{
    destination: string;
    startDate: nat64;
    endDate: nat64;
}>

// Create a storage for travel itineraries
const travelItineraryStorage = new StableBTreeMap<string, TravelItinerary>(0, 44, 1024);

/**
 * Get all travel itineraries.
 * @returns Result<Vec<TravelItinerary>, string> - A Result containing a Vec of travel itineraries or an error message.
 */
$query;
export function getTravelItineraries(): Result<Vec<TravelItinerary>, string> {
    try {
        return Result.Ok(travelItineraryStorage.values());
    } catch (error: unknown) {
        return Result.Err<Vec<TravelItinerary>, string>(`Error getting travel itineraries: ${(error as Error).message}`);
    }
}

/**
 * Get a specific travel itinerary by ID.
 * @param id - The ID of the travel itinerary to retrieve.
 * @returns Result<TravelItinerary, string> - A Result containing the requested travel itinerary or an error message.
 */
$query;
export function getTravelItinerary(id: string): Result<TravelItinerary, string> {
    try {
        return match(travelItineraryStorage.get(id), {
            Some: (travelItinerary) => Result.Ok<TravelItinerary, string>(travelItinerary),
            None: () => Result.Err<TravelItinerary, string>(`A travel itinerary with id=${id} not found`)
        });
    } catch (error: unknown) {
        return Result.Err<TravelItinerary, string>(`Error getting travel itinerary: ${(error as Error).message}`);
    }
}

/**
 * Add a new travel itinerary.
 * @param payload - The payload containing travel itinerary details.
 * @returns Result<TravelItinerary, string> - A Result containing the newly added travel itinerary or an error message.
 */
$update;
export function addTravelItinerary(payload: TravelItineraryPayload): Result<TravelItinerary, string> {
    try {
        // Validate input
        if (!payload.destination || !payload.startDate || !payload.endDate) {
            return Result.Err<TravelItinerary, string>('Invalid input. Please provide all required fields.');
        }

        // Validate date range
        if (payload.startDate >= payload.endDate) {
            return Result.Err<TravelItinerary, string>('End date must be after the start date.');
        }

        // Create and insert the travel itinerary
        const travelItinerary: TravelItinerary = {
            id: uuidv4(),
            createdAt: ic.time(),
            updatedAt: Opt.None,
            ...payload
        };
        travelItineraryStorage.insert(travelItinerary.id, travelItinerary);

        return Result.Ok(travelItinerary);
    } catch (error: unknown) {
        return Result.Err<TravelItinerary, string>(`Error adding travel itinerary: ${(error as Error).message}`);
    }
}

/**
 * Update an existing travel itinerary by ID.
 * @param id - The ID of the travel itinerary to update.
 * @param payload - The payload containing updated travel itinerary details.
 * @returns Result<TravelItinerary, string> - A Result containing the updated travel itinerary or an error message.
 */
$update;
export function updateTravelItinerary(id: string, payload: TravelItineraryPayload): Result<TravelItinerary, string> {
    try {
        // Validate input
        if (!payload.destination || !payload.startDate || !payload.endDate) {
            return Result.Err<TravelItinerary, string>('Invalid input. Please provide all required fields.');
        }

        // Validate date range
        if (payload.startDate >= payload.endDate) {
            return Result.Err<TravelItinerary, string>('End date must be after the start date.');
        }

        // Update the travel itinerary
        return match(travelItineraryStorage.get(id), {
            Some: (travelItinerary) => {
                const updatedTravelItinerary: TravelItinerary = {
                    ...travelItinerary,
                    ...payload,
                    updatedAt: Opt.Some(ic.time())
                };
                travelItineraryStorage.insert(travelItinerary.id, updatedTravelItinerary);
                return Result.Ok<TravelItinerary, string>(updatedTravelItinerary);
            },
            None: () => Result.Err<TravelItinerary, string>(`Couldn't update a travel itinerary with id=${id}. Travel itinerary not found`)
        });
    } catch (error: unknown) {
        return Result.Err<TravelItinerary, string>(`Error updating travel itinerary: ${(error as Error).message}`);
    }
}

/**
 * Delete a travel itinerary by ID.
 * @param id - The ID of the travel itinerary to delete.
 * @returns Result<TravelItinerary, string> - A Result containing the deleted travel itinerary or an error message.
 */
$update;
export function deleteTravelItinerary(id: string): Result<TravelItinerary, string> {
    try {
        return match(travelItineraryStorage.remove(id), {
            Some: (deletedTravelItinerary) => Result.Ok<TravelItinerary, string>(deletedTravelItinerary),
            None: () => Result.Err<TravelItinerary, string>(`Couldn't delete a travel itinerary with id=${id}. Travel itinerary not found.`)
        });
    } catch (error: unknown) {
        return Result.Err<TravelItinerary, string>(`Error deleting travel itinerary: ${(error as Error).message}`);
    }
}

/**
 * Search for travel itineraries based on a keyword.
 * @param keyword - The keyword to search for in destinations.
 * @returns Result<Vec<TravelItinerary>, string> - A Result containing a Vec of filtered travel itineraries or an error message.
 */
$query;
export function searchTravelItineraries(keyword: string): Result<Vec<TravelItinerary>, string> {
    try {
        const filteredItineraries = travelItineraryStorage
            .values()
            .filter((itinerary) =>
                itinerary.destination.toLowerCase().includes(keyword.toLowerCase())
            );

        return Result.Ok(filteredItineraries);
    } catch (error: unknown) {
        return Result.Err<Vec<TravelItinerary>, string>(`Error searching travel itineraries: ${(error as Error).message}`);
    }
}

/**
 * Count the total number of travel itineraries.
 * @returns Result<number, string> - A Result containing the count of travel itineraries or an error message.
 */
$query;
export function countTravelItineraries(): Result<number, string> {
    try {
        const count = travelItineraryStorage.len();

        // Convert the bigint to number
        const countAsNumber = Number(count);

        return Result.Ok(countAsNumber);
    } catch (error: unknown) {
        return Result.Err<number, string>(`Error counting travel itineraries: ${(error as Error).message}`);
    }
}

/**
 * Get a paginated list of travel itineraries.
 * @param page - The page number.
 * @param pageSize - The number of items per page.
 * @returns Result<Vec<TravelItinerary>, string> - A Result containing a Vec of paginated travel itineraries or an error message.
 */
$query;
export function getTravelItinerariesPaginated(page: number, pageSize: number): Result<Vec<TravelItinerary>, string> {
    try {
        const startIdx = (page - 1) * pageSize;
        const paginatedItineraries = travelItineraryStorage.values().slice(startIdx, startIdx + pageSize);

        return Result.Ok(paginatedItineraries);
    } catch (error: unknown) {
        return Result.Err<Vec<TravelItinerary>, string>(`Error getting paginated travel itineraries: ${(error as Error).message}`);
    }
}

/**
 * Get travel itineraries within a specific time range.
 * @param startTime - The start time of the range.
 * @param endTime - The end time of the range.
 * @returns Result<Vec<TravelItinerary>, string> - A Result containing a Vec of filtered travel itineraries or an error message.
 */
$query;
export function getTravelItinerariesByTimeRange(startTime: nat64, endTime: nat64): Result<Vec<TravelItinerary>, string> {
    try {
        const filteredItineraries = travelItineraryStorage
            .values()
            .filter((itinerary) => itinerary.startDate >= startTime && itinerary.endDate <= endTime);

        return Result.Ok(filteredItineraries);
    } catch (error: unknown) {
        return Result.Err<Vec<TravelItinerary>, string>(`Error getting travel itineraries by time range: ${(error as Error).message}`);
    }
}

// Workaround to make uuid package work with Azle
globalThis.crypto = {
    // @ts-ignore
    getRandomValues: () => {
        let array = new Uint8Array(32);

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }

        return array;
    }
};
