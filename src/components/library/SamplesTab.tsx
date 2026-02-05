import { useState } from "react";
import { Link } from "react-router-dom";
import { Music, Package, Search, Filter, ArrowUpDown, Eye, Edit, Trash2, Play, Ban, Check, Info, Tag, X, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SampleStatusFilter = "all" | "Active" | "Disabled";
type SortOption = "a-z" | "newest" | "most-downloaded";

interface Sample {
  id: number;
  name: string;
  pack: { id: number; name: string };
  creator: string;
  genre: string;
  bpm: number | null;
  key: string | null;
  type: "Loop" | "One-shot"; // NOTE: 'Stem' is NOT a type - stems are bundles attached to samples
  downloads: number;
  status: "Active" | "Disabled";
  hasStems: boolean; // Does this sample have stems bundle?
  stemsCount?: number; // Number of stem files (if hasStems = true)
  createdAt: string;
}

interface SamplesTabProps {
  samples: Sample[];
  uniqueTypes: string[];
  uniquePacks: string[];
  uniqueCreators: string[];
  uniqueGenres: string[];
  uniqueKeys: string[];
}

export function SamplesTab({
  samples,
  uniqueTypes,
  uniquePacks,
  uniqueCreators,
  uniqueGenres,
  uniqueKeys,
}: SamplesTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SampleStatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [packFilter, setPackFilter] = useState<string>("all");
  const [creatorFilter, setCreatorFilter] = useState<string>("all");
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [keyFilter, setKeyFilter] = useState<string>("all");
  const [bpmMin, setBpmMin] = useState<string>("");
  const [bpmMax, setBpmMax] = useState<string>("");
  const [sort, setSort] = useState<SortOption>("newest");

  const clearFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
    setPackFilter("all");
    setCreatorFilter("all");
    setGenreFilter("all");
    setKeyFilter("all");
    setBpmMin("");
    setBpmMax("");
    setSearchQuery("");
  };

  const activeFiltersCount = [
    statusFilter !== "all",
    typeFilter !== "all",
    packFilter !== "all",
    creatorFilter !== "all",
    genreFilter !== "all",
    keyFilter !== "all",
    bpmMin !== "",
    bpmMax !== "",
  ].filter(Boolean).length;

  const filteredAndSortedSamples = samples
    .filter(sample => {
      const matchesSearch = 
        sample.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sample.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sample.pack.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || sample.status === statusFilter;
      const matchesType = typeFilter === "all" || sample.type === typeFilter;
      const matchesPack = packFilter === "all" || sample.pack.name === packFilter;
      const matchesCreator = creatorFilter === "all" || sample.creator === creatorFilter;
      const matchesGenre = genreFilter === "all" || sample.genre === genreFilter;
      const matchesKey = keyFilter === "all" || sample.key === keyFilter;
      
      // BPM range filter
      let matchesBpm = true;
      if (bpmMin !== "" || bpmMax !== "") {
        const bpm = sample.bpm;
        if (bpm === null) {
          matchesBpm = false;
        } else {
          if (bpmMin !== "" && bpm < parseInt(bpmMin)) matchesBpm = false;
          if (bpmMax !== "" && bpm > parseInt(bpmMax)) matchesBpm = false;
        }
      }

      return matchesSearch && matchesStatus && matchesType && matchesPack && 
             matchesCreator && matchesGenre && matchesKey && matchesBpm;
    })
    .sort((a, b) => {
      switch (sort) {
        case "a-z":
          return a.name.localeCompare(b.name);
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "most-downloaded":
          return b.downloads - a.downloads;
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-4">
      {/* Data Structure & Visibility Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="space-y-1">
          <div>
            <strong>Pack-First Architecture:</strong> Every sample must belong to a pack. Single samples are still packaged as "packs with 1 sample".
          </div>
          <div className="text-xs mt-1">
            <strong>Visibility:</strong> A sample is visible to users ONLY if its pack is Published AND the sample itself is Active.
          </div>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5 text-purple-500" />
              All Samples
            </CardTitle>
            <Button asChild>
              <Link to="/admin/library?tab=packs">
                <Package className="mr-2 h-4 w-4" />
                Manage via Packs
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            To add new samples, go to a pack and upload there. All samples must belong to a pack.
          </p>
          
          <div className="space-y-4 mt-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sample name, pack, creator…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filters and Sort Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Type Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    {typeFilter === "all" ? "Type" : typeFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setTypeFilter("all")}>
                    All Types
                  </DropdownMenuItem>
                  {uniqueTypes.map(type => (
                    <DropdownMenuItem key={type} onClick={() => setTypeFilter(type)}>
                      {type}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Pack Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Package className="h-4 w-4" />
                    {packFilter === "all" ? "Pack" : packFilter.length > 20 ? packFilter.substring(0, 20) + "..." : packFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
                  <DropdownMenuLabel>Filter by Pack</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setPackFilter("all")}>
                    All Packs
                  </DropdownMenuItem>
                  {uniquePacks.map(pack => (
                    <DropdownMenuItem key={pack} onClick={() => setPackFilter(pack)}>
                      {pack}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Creator Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    {creatorFilter === "all" ? "Creator" : creatorFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Filter by Creator</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setCreatorFilter("all")}>
                    All Creators
                  </DropdownMenuItem>
                  {uniqueCreators.map(creator => (
                    <DropdownMenuItem key={creator} onClick={() => setCreatorFilter(creator)}>
                      {creator}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Genre Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Tag className="h-4 w-4" />
                    {genreFilter === "all" ? "Genre" : genreFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Filter by Genre</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setGenreFilter("all")}>
                    All Genres
                  </DropdownMenuItem>
                  {uniqueGenres.map(genre => (
                    <DropdownMenuItem key={genre} onClick={() => setGenreFilter(genre)}>
                      {genre}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* BPM Range */}
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  placeholder="Min BPM"
                  value={bpmMin}
                  onChange={(e) => setBpmMin(e.target.value)}
                  className="w-24 h-9"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="number"
                  placeholder="Max BPM"
                  value={bpmMax}
                  onChange={(e) => setBpmMax(e.target.value)}
                  className="w-24 h-9"
                />
              </div>

              {/* Key Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Music className="h-4 w-4" />
                    {keyFilter === "all" ? "Key" : keyFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Filter by Key</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setKeyFilter("all")}>
                    All Keys
                  </DropdownMenuItem>
                  {uniqueKeys.map(key => (
                    <DropdownMenuItem key={key} onClick={() => setKeyFilter(key)}>
                      {key}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Status Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    {statusFilter === "all" ? "Status" : statusFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                    All Status
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("Active")}>
                    Active (allowed in packs)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("Disabled")}>
                    Disabled (hidden)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sort */}
              <div className="ml-auto flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      {sort === "a-z" ? "A-Z" : sort === "newest" ? "Newest" : "Most Downloaded"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSort("a-z")}>
                      A-Z
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSort("newest")}>
                      Newest
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSort("most-downloaded")}>
                      Most Downloaded
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Clear Filters */}
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground"
                  >
                    Clear Filters ({activeFiltersCount})
                  </Button>
                )}
              </div>
            </div>

            {/* Active Filters Display */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2">
                {typeFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Type: {typeFilter}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setTypeFilter("all")} />
                  </Badge>
                )}
                {packFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Pack: {packFilter}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setPackFilter("all")} />
                  </Badge>
                )}
                {creatorFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Creator: {creatorFilter}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setCreatorFilter("all")} />
                  </Badge>
                )}
                {genreFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Genre: {genreFilter}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setGenreFilter("all")} />
                  </Badge>
                )}
                {keyFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Key: {keyFilter}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setKeyFilter("all")} />
                  </Badge>
                )}
                {(bpmMin !== "" || bpmMax !== "") && (
                  <Badge variant="secondary" className="gap-1">
                    BPM: {bpmMin || "0"} - {bpmMax || "∞"}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => { setBpmMin(""); setBpmMax(""); }} />
                  </Badge>
                )}
                {statusFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Status: {statusFilter}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter("all")} />
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Results Count */}
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredAndSortedSamples.length} of {samples.length} samples
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sample Name</TableHead>
                <TableHead>
                  Pack
                  <span className="text-xs text-muted-foreground ml-1">(required)</span>
                </TableHead>
                <TableHead>Creator</TableHead>
                <TableHead>BPM / Key</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Stems</TableHead>
                <TableHead className="text-right">Downloads</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedSamples.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No samples found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedSamples.map((sample) => (
                  <TableRow key={sample.id}>
                    <TableCell className="font-medium">{sample.name}</TableCell>
                    <TableCell>
                      <Link 
                        to={`/admin/library/packs/${sample.pack.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {sample.pack.name}
                      </Link>
                    </TableCell>
                    <TableCell>{sample.creator}</TableCell>
                    <TableCell>
                      {sample.bpm && sample.key
                        ? `${sample.bpm} BPM / ${sample.key}`
                        : sample.bpm
                        ? `${sample.bpm} BPM`
                        : sample.key
                        ? sample.key
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{sample.type}</Badge>
                    </TableCell>
                    <TableCell>
                      {sample.hasStems ? (
                        <Badge variant="secondary" className="gap-1">
                          <Music className="h-3 w-3" />
                          {sample.stemsCount || 0} files
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {sample.downloads.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={sample.status === "Active" ? "default" : "destructive"}
                      >
                        {sample.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/library/packs/${sample.pack.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Pack
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Sample
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Play className="mr-2 h-4 w-4" />
                            Play Preview
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {sample.status === "Active" ? (
                            <DropdownMenuItem className="text-orange-600">
                              <Ban className="mr-2 h-4 w-4" />
                              Disable Sample
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="text-green-600">
                              <Check className="mr-2 h-4 w-4" />
                              Activate Sample
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Sample
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
