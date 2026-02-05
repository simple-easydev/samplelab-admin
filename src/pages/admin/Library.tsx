import { useNavigate, useSearchParams } from "react-router-dom";
import { Package, Music, Tag, Folder, Heart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PacksTab } from "@/components/library/PacksTab";
import { SamplesTab } from "@/components/library/SamplesTab";
import { GenresTab } from "@/components/library/GenresTab";
import { CategoriesTab } from "@/components/library/CategoriesTab";
import { MoodsTab } from "@/components/library/MoodsTab";

type LibraryTab = "packs" | "samples" | "genres" | "categories" | "moods";

// Mock data for packs - replace with real API data
const mockPacks = [
  {
    id: 1,
    name: "Trap Essentials Vol.1",
    creator: "Producer Mike",
    genre: "Trap",
    category: "Drums",
    tags: ["808", "Drums", "Bass"],
    samples: 45,
    downloads: 450,
    status: "Published" as const,
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    name: "Lo-Fi Hip Hop Bundle",
    creator: "Beat Master",
    genre: "Lo-Fi",
    category: "Loops",
    tags: ["Chill", "Hip Hop", "Beats"],
    samples: 32,
    downloads: 380,
    status: "Published" as const,
    createdAt: "2024-01-20",
  },
  {
    id: 3,
    name: "EDM Starter Kit",
    creator: "Rhythm King",
    genre: "EDM",
    category: "Synths",
    tags: ["Electronic", "Dance", "Synth"],
    samples: 28,
    downloads: 320,
    status: "Published" as const,
    createdAt: "2024-02-01",
  },
  {
    id: 4,
    name: "House Drums Pack",
    creator: "DJ Flow",
    genre: "House",
    category: "Drums",
    tags: ["House", "Drums", "Percussion"],
    samples: 38,
    downloads: 285,
    status: "Published" as const,
    createdAt: "2024-01-28",
  },
  {
    id: 5,
    name: "Vocal Chops Collection",
    creator: "Sound Wave",
    genre: "Hip Hop",
    category: "Vocals",
    tags: ["Vocals", "Chops", "Processed"],
    samples: 24,
    downloads: 240,
    status: "Disabled" as const,
    createdAt: "2024-01-10",
  },
  {
    id: 6,
    name: "Synthwave Essentials",
    creator: "Producer Mike",
    genre: "Synthwave",
    category: "Synths",
    tags: ["80s", "Retro", "Synth"],
    samples: 52,
    downloads: 198,
    status: "Disabled" as const,
    createdAt: "2024-02-03",
  },
  // Example: Single-sample pack (Pack-First Architecture)
  {
    id: 7,
    name: "Heavy Kick Premium",
    creator: "Sound Wave",
    genre: "Trap",
    category: "Drums",
    tags: ["Kick", "808", "Bass"],
    samples: 1,  // Single sample, still a pack
    downloads: 156,
    status: "Published" as const,
    createdAt: "2024-02-05",
  },
];

// Extract unique values for filters
const uniqueCreators = Array.from(new Set(mockPacks.map(p => p.creator)));
const uniqueGenres = Array.from(new Set(mockPacks.map(p => p.genre)));
const uniqueCategories = Array.from(new Set(mockPacks.map(p => p.category)));
const uniqueTags = Array.from(new Set(mockPacks.flatMap(p => p.tags)));

// Mock data for samples - replace with real API data
// IMPORTANT: Every sample MUST have a pack - no orphaned samples allowed
const mockSamples = [
  {
    id: 1,
    name: "808 Bass Hit",
    pack: { id: 1, name: "Trap Essentials Vol.1" },
    creator: "Producer Mike",
    genre: "Trap",
    bpm: 140,
    key: "C",
    type: "One-shot" as const,
    downloads: 1240,
    status: "Active" as const,
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    name: "Snare Clap",
    pack: { id: 2, name: "Lo-Fi Hip Hop Bundle" },
    creator: "Beat Master",
    genre: "Lo-Fi",
    bpm: null,
    key: null,
    type: "One-shot" as const,
    downloads: 980,
    status: "Active" as const,
    createdAt: "2024-01-20",
  },
  {
    id: 3,
    name: "Hi-Hat Loop",
    pack: { id: 3, name: "EDM Starter Kit" },
    creator: "Rhythm King",
    genre: "EDM",
    bpm: 128,
    key: "Am",
    type: "Loop" as const,
    downloads: 856,
    status: "Active" as const,
    createdAt: "2024-02-01",
  },
  {
    id: 4,
    name: "Synth Lead",
    pack: { id: 1, name: "Trap Essentials Vol.1" },
    creator: "Producer Mike",
    genre: "Trap",
    bpm: 140,
    key: "F#",
    type: "Loop" as const,
    downloads: 743,
    status: "Disabled" as const,
    createdAt: "2024-01-16",
  },
  {
    id: 5,
    name: "Kick Drum",
    pack: { id: 4, name: "House Drums Pack" },
    creator: "DJ Flow",
    genre: "House",
    bpm: null,
    key: null,
    type: "One-shot" as const,
    downloads: 621,
    status: "Active" as const,
    createdAt: "2024-01-28",
  },
  {
    id: 6,
    name: "Vocal Chop Stem",
    pack: { id: 5, name: "Vocal Chops Collection" },
    creator: "Sound Wave",
    genre: "Hip Hop",
    bpm: 120,
    key: "D",
    type: "Stem" as const,
    downloads: 543,
    status: "Active" as const,
    createdAt: "2024-01-10",
  },
  {
    id: 7,
    name: "Piano Loop",
    pack: { id: 2, name: "Lo-Fi Hip Hop Bundle" },
    creator: "Beat Master",
    genre: "Lo-Fi",
    bpm: 85,
    key: "Gm",
    type: "Loop" as const,
    downloads: 487,
    status: "Active" as const,
    createdAt: "2024-01-21",
  },
  {
    id: 8,
    name: "Crash Cymbal",
    pack: { id: 4, name: "House Drums Pack" },
    creator: "DJ Flow",
    genre: "House",
    bpm: null,
    key: null,
    type: "One-shot" as const,
    downloads: 392,
    status: "Disabled" as const,
    createdAt: "2024-01-29",
  },
  // Example: Sample from single-sample pack (Pack-First Architecture)
  {
    id: 9,
    name: "Heavy Kick.wav",
    pack: { id: 7, name: "Heavy Kick Premium" },  // Single-sample pack
    creator: "Sound Wave",
    genre: "Trap",
    bpm: 140,
    key: "C",
    type: "One-shot" as const,
    downloads: 156,
    status: "Active" as const,
    createdAt: "2024-02-05",
  },
];

// Extract unique values for sample filters
const uniqueSampleTypes = Array.from(new Set(mockSamples.map(s => s.type)));
const uniqueSamplePacks = Array.from(new Set(mockSamples.map(s => s.pack.name)));
const uniqueSampleCreators = Array.from(new Set(mockSamples.map(s => s.creator)));
const uniqueSampleGenres = Array.from(new Set(mockSamples.map(s => s.genre)));
const uniqueSampleKeys = Array.from(new Set(mockSamples.filter(s => s.key !== null).map(s => s.key as string)));

export default function LibraryPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tab = (searchParams.get("tab") as LibraryTab) || "packs";

  const handleTabChange = (value: string) => {
    navigate(`/admin/library?tab=${value}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Library Management</h1>
        <p className="text-muted-foreground mt-1">Manage your sample library content</p>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="packs" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Packs
          </TabsTrigger>
          <TabsTrigger value="samples" className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            Samples
          </TabsTrigger>
          <TabsTrigger value="genres" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Genres
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Folder className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="moods" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Moods
          </TabsTrigger>
        </TabsList>

        {/* Packs Tab */}
        <TabsContent value="packs" className="space-y-4">
          <PacksTab
            packs={mockPacks}
            uniqueCreators={uniqueCreators}
            uniqueGenres={uniqueGenres}
            uniqueCategories={uniqueCategories}
            uniqueTags={uniqueTags}
          />
        </TabsContent>

        {/* Samples Tab */}
        <TabsContent value="samples" className="space-y-4">
          <SamplesTab
            samples={mockSamples}
            uniqueTypes={uniqueSampleTypes}
            uniquePacks={uniqueSamplePacks}
            uniqueCreators={uniqueSampleCreators}
            uniqueGenres={uniqueSampleGenres}
            uniqueKeys={uniqueSampleKeys}
          />
        </TabsContent>

        {/* Genres Tab */}
        <TabsContent value="genres" className="space-y-4">
          <GenresTab />
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <CategoriesTab />
        </TabsContent>

        {/* Moods Tab */}
        <TabsContent value="moods" className="space-y-4">
          <MoodsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
