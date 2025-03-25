import { useState, useEffect } from "react";
import { getLibraries, addLibrary } from "@/firebase/functions";
import useStore from "@/hooks/store";
import { useRouter } from "expo-router";

export interface Library {
  id: string;
  name: string;
  address: string;
  description: string;
}

export function useLibrarySelection() {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUser = useStore((state: any) => state.currentUser);
  const activeLibrary = useStore((state: any) => state.activeLibrary);
  const setActiveLibrary = useStore((state: any) => state.setActiveLibrary);
  const router = useRouter();

  // Function to fetch libraries
  const fetchLibraries = async () => {
    try {
      const data = await getLibraries({ currentUser });
      if (Array.isArray(data) && data.length > 0) {
        setLibraries(data);
        if (!activeLibrary) {
          setActiveLibrary(data[0]);
        }
        setError(null);
      } else {
        if (currentUser && libraries.length === 0) {
          const newLibrary = {
            name: "Default Library",
            address: "N/A",
            description: "Automatically created library",
          };
          await addLibrary({ data: newLibrary, currentUser });
          const updatedLibraries = await getLibraries({ currentUser });
          if (updatedLibraries.length > 0) {
            setLibraries(updatedLibraries);
            setActiveLibrary(updatedLibraries[0]);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching libraries:", error);
      setError("Unable to fetch libraries. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch libraries on mount
  useEffect(() => {
    fetchLibraries();
  }, [currentUser, setActiveLibrary]);

  // Function to refresh libraries
  const refreshLibraries = async () => {
    setLoading(true);
    await fetchLibraries();
  };

  // Function to handle library selection
  const handleLibrarySelect = (libraryId: string) => {
    const selected = libraries.find((lib) => lib.id === libraryId);
    if (selected) {
      setActiveLibrary(selected);
    }
    router.replace("/");
  };

  return {
    libraries,
    loading,
    error,
    activeLibrary,
    handleLibrarySelect,
    refreshLibraries, // Expose the refresh function
  };
}