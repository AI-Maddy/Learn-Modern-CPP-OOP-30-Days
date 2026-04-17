// ─────────────────────────────────────────────────────────────────────────────
// MindMap.tsx  —  Interactive mind-map built with React Flow.
//
// Renders the 31 curriculum days as a graph:
//   • A central "Modern C++ OOP" hub in the middle
//   • 7 cluster hub nodes arranged in a circle around the centre
//   • Individual day nodes arranged in smaller circles around each cluster hub
//   • Animated edges connecting the centre → clusters
//   • Static edges connecting each cluster → its days
//
// Clicking any day node navigates to that day's page.
// ─────────────────────────────────────────────────────────────────────────────

// useCallback: memoises a function so it isn't recreated on every render.
// useMemo: memoises an expensive computed value (here: the graph layout).
import { useCallback, useMemo } from "react";

// React Flow is an open-source library for interactive node/edge graphs.
// We import the main component plus helper hooks and type definitions.
import ReactFlow, {
  Background,        // Renders the dot-grid background pattern
  Controls,          // Renders the zoom-in / zoom-out / fit-view control panel
  MiniMap,           // Renders the small overview map in the corner
  useNodesState,     // Hook: manages the array of node objects with position tracking
  useEdgesState,     // Hook: manages the array of edge objects
  type Node,         // TypeScript type for a single node in the graph
  type Edge,         // TypeScript type for a single edge (line) between two nodes
  BackgroundVariant, // Enum: Dots | Lines | Cross — style of the background grid
} from "reactflow";

// React Flow requires its own CSS for drag handles, selection boxes, etc.
import "reactflow/dist/style.css";

// Import our shared TypeScript types so callers know what data to pass.
import type { DayMeta, Cluster } from "../lib/types";

// ── Props ─────────────────────────────────────────────────────────────────────
// The parent page (mindmap.astro) passes the full manifest data down as props.
interface Props {
  days:     DayMeta[];              // All 31 day metadata objects
  clusters: Record<string, Cluster>; // Map of cluster key → cluster details
}

// ── CLUSTER_COLORS ────────────────────────────────────────────────────────────
// Maps colour names (from the manifest) to hex values used in node/edge styles.
// React Flow uses inline styles rather than Tailwind, so we need raw hex values.
const CLUSTER_COLORS: Record<string, string> = {
  blue:   "#3b82f6",
  green:  "#22c55e",
  violet: "#8b5cf6",
  red:    "#ef4444",
  orange: "#f97316",
  yellow: "#eab308",
  slate:  "#94a3b8",
};

// ── buildGraph ────────────────────────────────────────────────────────────────
// Pure function: converts the manifest data into React Flow nodes and edges.
// Called once and memoised — it doesn't need to re-run unless the data changes.
//
// Layout algorithm:
//   1. Place cluster hubs at equal angles on a circle of radius R around (600, 360).
//   2. Place each cluster's day nodes on a smaller circle of radius r around their hub.
//   3. Add edges from centre → each hub (animated) and hub → each day (static).
function buildGraph(days: DayMeta[], clusters: Record<string, Cluster>) {
  const nodes: Node[] = []; // Accumulator for all node objects
  const edges: Edge[] = []; // Accumulator for all edge objects

  const clusterKeys = Object.keys(clusters); // e.g. ["foundations","oop-core", …]
  const R = 320; // Radius of the outer circle on which cluster hub nodes are placed (px)
  const r = 100; // Radius of the inner circle on which day nodes orbit their cluster hub (px)

  clusterKeys.forEach((key, ci) => {
    const c = clusters[key]; // The Cluster object for this key

    // Calculate the angle for this cluster hub on the circle.
    // Dividing the full circle (2π) equally among all clusters gives even spacing.
    // Subtracting π/2 rotates so the first cluster starts at the top (12 o'clock).
    const angle = (ci / clusterKeys.length) * 2 * Math.PI - Math.PI / 2;

    // Convert polar coordinates (angle + radius) to Cartesian (x, y).
    // cx / cy are the hub's position relative to the centre of the graph.
    const cx = Math.cos(angle) * R;
    const cy = Math.sin(angle) * R;

    // Look up the hex colour for this cluster, falling back to slate grey
    const color = CLUSTER_COLORS[c.color] ?? "#94a3b8";

    // ── Push the cluster hub node ─────────────────────────────────────────
    nodes.push({
      id: `cluster-${key}`,              // Unique id; also used as edge source/target
      position: { x: cx + 600, y: cy + 360 }, // +600/+360 shifts origin to centre of canvas
      data: { label: `${c.icon}\n${c.label}` }, // Text shown inside the node; \n = line break
      style: {
        background: `${color}20`,        // Very transparent fill (20 = ~12% opacity in hex)
        border: `2px solid ${color}`,    // Solid border in the cluster colour
        color: "#fff",                   // White text
        borderRadius: "12px",            // Rounded rectangle
        padding: "10px 16px",
        fontSize: "12px",
        fontWeight: 700,
        textAlign: "center" as const,    // `as const` required because TypeScript is strict
        whiteSpace: "pre-line",          // Respect the \n in the label to create two lines
        width: 120,
      },
      type: "default", // React Flow's built-in node type (rectangular with connection handles)
    });

    // ── Push day nodes around this cluster hub ────────────────────────────
    const clusterDays = days.filter(d => d.cluster === key); // Days that belong to this cluster

    clusterDays.forEach((day, di) => {
      // Same math as cluster hubs but using the smaller radius r.
      // We add `angle` so day nodes orbit the hub, not the overall centre.
      const a2 = (di / clusterDays.length) * 2 * Math.PI + angle;
      const dx = cx + Math.cos(a2) * r; // x offset relative to centre of canvas
      const dy = cy + Math.sin(a2) * r; // y offset relative to centre of canvas

      nodes.push({
        id: day.slug,                            // e.g. "day-05" — unique per node
        position: { x: dx + 600, y: dy + 360 }, // Absolute canvas position
        data: {
          // Show "Day 05\nSmart Pointers…" with the first 3 words of the title
          label: `Day ${String(day.day).padStart(2, "0")}\n${day.title.split(" ").slice(0, 3).join(" ")}`,
        },
        style: {
          background: "#1e2535",            // Dark background to blend with the page
          border: `1px solid ${color}60`,  // Faint coloured border (60 = ~38% opacity)
          color: "#e2e8f0",                 // Light grey text
          borderRadius: "10px",
          padding: "8px 12px",
          fontSize: "10px",
          cursor: "pointer",               // Show pointer cursor to hint nodes are clickable
          textAlign: "center" as const,
          whiteSpace: "pre-line",          // Respect the \n in the label
          width: 100,
          transition: "all 0.2s",          // Smooth hover transition
        },
        type: "default",
      });

      // ── Edge: cluster hub → day ──────────────────────────────────────────
      edges.push({
        id: `e-${key}-${day.slug}`,    // Unique edge id
        source: `cluster-${key}`,      // Edge starts at the cluster hub
        target: day.slug,              // Edge ends at this day node
        style: { stroke: `${color}40`, strokeWidth: 1 }, // Faint coloured line
        animated: false,               // Static line (no marching ants animation)
      });
    });
  });

  // ── Centre node ────────────────────────────────────────────────────────────
  // unshift() adds to the FRONT of the array so it's rendered first (behind other nodes).
  nodes.unshift({
    id: "center",
    position: { x: 560, y: 330 },  // Manually tuned to sit at the visual centre
    data: { label: "⚡\nModern C++\nOOP" }, // Three-line label
    style: {
      background: "linear-gradient(135deg,#3b82f620,#8b5cf620)", // Blue→violet gradient
      border: "2px solid #8b5cf6",  // Violet border
      color: "#fff",
      borderRadius: "50%",          // Circle shape (equal width/height)
      width: 90,
      height: 90,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "11px",
      fontWeight: 700,
      textAlign: "center" as const,
      whiteSpace: "pre-line",
    },
  });

  // ── Edges from centre to each cluster hub ─────────────────────────────────
  // unshift() again so these edges render behind the cluster edges.
  clusterKeys.forEach(key => {
    edges.unshift({
      id: `e-center-${key}`,
      source: "center",          // Starts at the centre node
      target: `cluster-${key}`, // Ends at the cluster hub
      style: { stroke: "#ffffff15", strokeWidth: 1.5 }, // Very faint white line
      animated: true,            // Marching-ants animation to show data flow direction
    });
  });

  return { nodes, edges }; // Return both arrays for React Flow
}

// ── MindMap component (main export) ──────────────────────────────────────────
export default function MindMap({ days, clusters }: Props) {
  // useMemo caches the result of buildGraph so it only recalculates when days
  // or clusters actually change (not on every render).
  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildGraph(days, clusters),
    [days, clusters] // Dependency array: rebuild if these values change
  );

  // useNodesState / useEdgesState are React Flow hooks that track node/edge arrays
  // and expose change handlers that React Flow calls internally when nodes are dragged.
  // We only need the array and the change handler; the setter (_) is ignored.
  const [nodes, , onNodesChange] = useNodesState(initNodes);
  const [edges, , onEdgesChange] = useEdgesState(initEdges);

  // onNodeClick: navigate to the day page when a day node is clicked.
  // useCallback memoises the function so React doesn't recreate it on every render.
  // The [] dependency array means the function never changes after mount.
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    // Clicking a cluster hub or the centre node does nothing — only day nodes navigate.
    if (node.id.startsWith("cluster-") || node.id === "center") return;
    // Navigate to the day page, e.g. /day/day-05
    window.location.href = `/day/${node.id}`;
  }, []);

  // Render the React Flow canvas with all nodes, edges, and UI controls
  return (
    <ReactFlow
      nodes={nodes}                  // Array of node objects to render
      edges={edges}                  // Array of edge objects to render
      onNodesChange={onNodesChange}  // Called when nodes are dragged or selected
      onEdgesChange={onEdgesChange}  // Called when edges change (e.g. removed)
      onNodeClick={onNodeClick}      // Called when the user clicks a node
      fitView                        // Automatically zoom/pan to fit all nodes on load
      fitViewOptions={{ padding: 0.15 }} // 15% padding around the fit boundary
      style={{ background: "#0f1117" }}  // Dark background behind all nodes
      proOptions={{ hideAttribution: true }} // Hides the "React Flow" watermark
    >
      {/* Dot-grid background: adds subtle visual texture to the canvas */}
      <Background variant={BackgroundVariant.Dots} color="#1e2535" gap={24} />

      {/* Zoom controls panel in the bottom-left corner */}
      <Controls style={{ background: "#1e2535", border: "1px solid #2a3347" }} />

      {/* Mini-map: small thumbnail of the full graph in the bottom-right corner.
          nodeColor function returns different colours based on node type. */}
      <MiniMap
        style={{ background: "#161b27", border: "1px solid #1e2535" }}
        nodeColor={(n) => {
          if (n.id === "center") return "#8b5cf6";          // Centre: violet
          if (n.id.startsWith("cluster-")) return "#3b82f6"; // Cluster hubs: blue
          return "#2a3347";                                  // Day nodes: dark grey
        }}
      />
    </ReactFlow>
  );
}
