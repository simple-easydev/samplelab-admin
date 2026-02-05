import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, Search, Filter, ArrowUpDown, Eye, Edit, Ban, Check, Trash2, X, MoreHorizontal, Loader2, AlertCircle } from "lucide-react";
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
import { supabase } from "@/lib/supabase";

type PackStatusFilter = "all" | "Draft" | "Published" | "Disabled";
type SortOption = "a-z" | "newest" | "most-downloaded";

interface Pack {
  id: string;
  name: string;
  creator_id: string;
  creator_name: string;
  category_id: string;
  category_name: string;
  genres: string[]; // Array of genre names
  tags: string[];
  samples_count: number;
  downloads: number;
  status: "Draft" | "Published" | "Disabled";
  cover_url?: string;
  created_at: string;
  is_premium: boolean;
}

export function PacksTab() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uniqueCreators, setUniqueCreators] = useState<string[]>([]);
  const [uniqueGenres, setUniqueGenres] = useState<string[]>([]);
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);
  const [uniqueTags, setUniqueTags] = useState<string[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PackStatusFilter>("all");
  const [creatorFilter, setCreatorFilter] = useState<string>("all");
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortOption>("newest");

  // Fetch packs from Supabase
  useEffect(() => {
    async function fetchPacks() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch packs with related data
        const { data: packsData, error: packsError } = await supabase
          .from("packs")
          .select(`
            id,
            name,
            creator_id,
            category_id,
            tags,
            download_count,
            status,
            cover_url,
            created_at,
            is_premium,
            creators (name),
            categories (name)
          `)
          .order("created_at", { ascending: false });

        if (packsError) throw packsError;

        // Get samples count for each pack
        const { data: samplesCount, error: samplesError } = await supabase
          .from("samples")
          .select("pack_id, id")
          .eq("status", "Active");

        if (samplesError) throw samplesError;

        // Count samples per pack
        const samplesByPack = samplesCount?.reduce((acc, sample: any) => {
          acc[sample.pack_id] = (acc[sample.pack_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        // Fetch genres for each pack
        const { data: packGenresData, error: genresError } = await supabase
          .from("pack_genres")
          .select(`
            pack_id,
            genres (name)
          `);

        if (genresError) throw genresError;

        // Group genres by pack
        const genresByPack = packGenresData?.reduce((acc, pg: any) => {
          if (!acc[pg.pack_id]) acc[pg.pack_id] = [];
          acc[pg.pack_id].push((pg.genres as any)?.name);
          return acc;
        }, {} as Record<string, string[]>) || {};

        // Transform data
        const transformedPacks: Pack[] = (packsData || []).map((pack: any) => ({
          id: pack.id,
          name: pack.name,
          creator_id: pack.creator_id,
          creator_name: pack.creators?.name || "Unknown",
          category_id: pack.category_id,
          category_name: pack.categories?.name || "Uncategorized",
          genres: genresByPack[pack.id] || [],
          tags: pack.tags || [],
          samples_count: samplesByPack[pack.id] || 0,
          downloads: pack.download_count || 0,
          status: pack.status,
          cover_url: pack.cover_url,
          created_at: pack.created_at,
          is_premium: pack.is_premium,
        }));

        setPacks(transformedPacks);

        // Extract unique values for filters
        const creators = Array.from(new Set(transformedPacks.map(p => p.creator_name)));
        const genres = Array.from(new Set(transformedPacks.flatMap(p => p.genres)));
        const categories = Array.from(new Set(transformedPacks.map(p => p.category_name)));
        const tags = Array.from(new Set(transformedPacks.flatMap(p => p.tags)));

        setUniqueCreators(creators);
        setUniqueGenres(genres);
        setUniqueCategories(categories);
        setUniqueTags(tags);

      } catch (err) {
        console.error("Error fetching packs:", err);
        setError(err instanceof Error ? err.message : "Failed to load packs");
      } finally {
        setIsLoading(false);
      }
    }

    fetchPacks();
  }, []);

  const clearFilters = () => {
    setStatusFilter("all");
    setCreatorFilter("all");
    setGenreFilter("all");
    setCategoryFilter("all");
    setTagFilter("all");
    setSearchQuery("");
  };

  const activeFiltersCount = [
    statusFilter !== "all",
    creatorFilter !== "all",
    genreFilter !== "all",
    categoryFilter !== "all",
    tagFilter !== "all",
  ].filter(Boolean).length;

  const filteredAndSortedPacks = packs
    .filter(pack => {
      const matchesSearch =
        pack.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pack.creator_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || pack.status === statusFilter;
      const matchesCreator = creatorFilter === "all" || pack.creator_name === creatorFilter;
      const matchesGenre = genreFilter === "all" || pack.genres.includes(genreFilter);
      const matchesCategory = categoryFilter === "all" || pack.category_name === categoryFilter;
      const matchesTag = tagFilter === "all" || pack.tags.includes(tagFilter);

      return matchesSearch && matchesStatus && matchesCreator && matchesGenre && matchesCategory && matchesTag;
    })
    .sort((a, b) => {
      switch (sort) {
        case "a-z":
          return a.name.localeCompare(b.name);
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "most-downloaded":
          return b.downloads - a.downloads;
        default:
          return 0;
      }
    });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-500" />
            Sample Packs
          </CardTitle>
          <Button asChild>
            <Link to="/admin/library/packs/new">
              <Package className="mr-2 h-4 w-4" />
              Create New Pack
            </Link>
          </Button>
        </div>
        <div className="space-y-4 mt-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pack name, creator…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters and Sort Row */}
          <div className="flex flex-wrap items-center gap-2">
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
                  <Filter className="h-4 w-4" />
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

            {/* Category Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  {categoryFilter === "all" ? "Category" : categoryFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setCategoryFilter("all")}>
                  All Categories
                </DropdownMenuItem>
                {uniqueCategories.map(category => (
                  <DropdownMenuItem key={category} onClick={() => setCategoryFilter(category)}>
                    {category}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Tags Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  {tagFilter === "all" ? "Tags" : tagFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
                <DropdownMenuLabel>Filter by Tag</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTagFilter("all")}>
                  All Tags
                </DropdownMenuItem>
                {uniqueTags.map(tag => (
                  <DropdownMenuItem key={tag} onClick={() => setTagFilter(tag)}>
                    {tag}
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
                <DropdownMenuItem onClick={() => setStatusFilter("Draft")}>
                  Draft (not visible to users)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("Published")}>
                  Published (live on site)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("Disabled")}>
                  Disabled (hidden from users)
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
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Status: {statusFilter}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter("all")} />
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
              {categoryFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Category: {categoryFilter}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setCategoryFilter("all")} />
                </Badge>
              )}
              {tagFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Tag: {tagFilter}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setTagFilter("all")} />
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-3" />
            <span className="text-sm text-gray-600">Loading packs from database...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-4"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Content - only show if not loading and no error */}
        {!isLoading && !error && (
          <>
            {/* Results Count */}
            <div className="mb-4 text-sm text-muted-foreground">
              Showing {filteredAndSortedPacks.length} of {packs.length} packs
            </div>

            <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Cover</TableHead>
              <TableHead>Pack Name</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead className="text-right">Samples</TableHead>
              <TableHead>Genre</TableHead>
              <TableHead className="text-right">Downloads</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedPacks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No packs found
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedPacks.map((pack) => (
                <TableRow key={pack.id}>
                  <TableCell>
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center overflow-hidden">
                      {pack.cover_url ? (
                        <img 
                          src={pack.cover_url} 
                          alt={pack.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-white" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Link 
                        to={`/admin/library/packs/${pack.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {pack.name}
                      </Link>
                      {pack.is_premium && (
                        <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 text-white">
                          Premium
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{pack.creator_name}</TableCell>
                  <TableCell className="text-right">{pack.samples_count}</TableCell>
                  <TableCell>
                    {pack.genres.length > 0 ? (
                      <div className="flex gap-1 flex-wrap">
                        {pack.genres.map((genre, idx) => (
                          <Badge key={idx} variant="outline">{genre}</Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No genres</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {pack.downloads.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        pack.status === "Published" 
                          ? "default" 
                          : pack.status === "Draft"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {pack.status}
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
                          <Link to={`/admin/library/packs/${pack.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Pack
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/admin/library/packs/${pack.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Pack
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {pack.status === "Published" ? (
                          <DropdownMenuItem className="text-orange-600">
                            <Ban className="mr-2 h-4 w-4" />
                            Disable Pack
                          </DropdownMenuItem>
                        ) : pack.status === "Draft" ? (
                          <DropdownMenuItem className="text-green-600">
                            <Check className="mr-2 h-4 w-4" />
                            Publish Pack
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-green-600">
                            <Check className="mr-2 h-4 w-4" />
                            Re-publish Pack
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Pack
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}
