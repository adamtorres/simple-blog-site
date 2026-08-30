import json
import random

from django.core.management.base import BaseCommand

# Code generated from Google.com when given the search query:
# game grid region generator based on rules catdoku


class Command(BaseCommand):
    help = 'Dump the settings values for specific keys.'

    def generate_catdoku(self, n=6):
        """
        Generates an N x N Catdoku grid with a valid solution and N colored regions.  The default grid size is 6x6.
        Returns:
            cats_positions: List of (r, c) tuples representing the solution.
            grid: N x N matrix where integers 0 to N-1 represent distinct colored zones.
        """
        # --- Step 1: Place Cats Legally (N-Queens / Star Battle Rules) ---
        def is_safe(r, c, placed_cats):
            for pr, pc in placed_cats:
                if pr == r or pc == c:  # Row or Column clash
                    return False
                if abs(pr - r) <= 1 and abs(pc - c) <= 1:  # Adjacent/Diagonal clash
                    return False
            return True

        def backcheck_place(r, placed_cats):
            if r == n:
                return True
            columns = list(range(n))
            random.shuffle(columns)  # Add randomness to the board layout
            for c in columns:
                if is_safe(r, c, placed_cats):
                    placed_cats.append((r, c))
                    if backcheck_place(r + 1, placed_cats):
                        return True
                    placed_cats.pop()
            return False

        cats_positions = []
        # Loop to ensure we get a valid layout; small grids might occasionally bottleneck
        while not backcheck_place(0, cats_positions):
            cats_positions = []

        # --- Step 2: Initialize Grid Regions ---
        # Assign each cat to its own distinct region ID (0 to n-1)
        grid = [[-1] * n for _ in range(n)]
        queue = []
        for region_id, (r, c) in enumerate(cats_positions):
            grid[r][c] = region_id
            queue.append((r, c, region_id))

        # --- Step 3: Flood-Fill / Expand Regions Orthogonally ---
        random.shuffle(queue)  # Shuffle starting queue for more organic shapes
        
        while queue:
            r, c, region_id = queue.pop(0)
            
            # Get orthogonal neighbors (Up, Down, Left, Right)
            neighbors = [(r-1, c), (r+1, c), (r, c-1), (r, c+1)]
            random.shuffle(neighbors) # Randomize expansion direction
            
            for nr, nc in neighbors:
                if 0 <= nr < n and 0 <= nc < n and grid[nr][nc] == -1:
                    grid[nr][nc] = region_id
                    queue.append((nr, nc, region_id))

        return cats_positions, grid
    
    def add_arguments(self, parser):
        parser.add_argument(
            '-g',
            '--grid-size',
            action='store',
            dest='grid_size',
            help="The size of the grid and number of animals",
            required=False,
            type=int,
            default=6,
        )

    def handle(self, *args, **options):
        cats, region_grid = self.generate_catdoku(options['grid_size'])
        self.output_human_readable(cats, region_grid)
        self.output_data(cats, region_grid)
        
    def output_data(self, cats, region_grid):
        self.stdout.write(json.dumps({"cat positions": cats, "region_grid": region_grid}, sort_keys=True, default=str))

    def output_human_readable(self, cats, region_grid):
        self.stdout.write("--- SOLUTION CAT POSITIONS ---")
        self.stdout.write(f"{cats!r}")

        self.stdout.write("\n--- GENERATED REGION GRID (0 to 5 represent distinct colors) ---")
        for row in region_grid:
            self.stdout.write(" ".join(f"[{cell}]" for cell in row))
