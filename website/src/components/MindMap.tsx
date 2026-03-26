import { useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import type { DayMeta, Cluster } from "../lib/types";

interface Props {
  days: DayMeta[];
  clusters: Record<string, Cluster>;
}

const CLUSTER_COLORS: Record<string, string> = {
  blue:   "#3b82f6",
  green:  "#22c55e",
  violet: "#8b5cf6",
  red:    "#ef4444",
  orange: "#f97316",
  yellow: "#eab308",
  slate:  "#94a3b8",
};

// Layout: cluster hub nodes in a circle, day nodes around each hub
function buildGraph(days: DayMeta[], clusters: Record<string, Cluster>) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const clusterKeys = Object.keys(clusters);
  const R = 320; // radius for cluster hubs
  const r = 100; // radius for day nodes around hub

  clusterKeys.forEach((key, ci) => {
    const c = clusters[key];
    const angle = (ci / clusterKeys.length) * 2 * Math.PI - Math.PI / 2;
    const cx = Math.cos(angle) * R;
    const cy = Math.sin(angle) * R;
    const color = CLUSTER_COLORS[c.color] ?? "#94a3b8";

    // Hub node
    nodes.push({
      id: `cluster-${key}`,
      position: { x: cx + 600, y: cy + 360 },
      data: { label: `${c.icon}\n${c.label}` },
      style: {
        background: `${color}20`,
        border: `2px solid ${color}`,
        color: "#fff",
        borderRadius: "12px",
        padding: "10px 16px",
        fontSize: "12px",
        fontWeight: 700,
        textAlign: "center" as const,
        whiteSpace: "pre-line",
        width: 120,
      },
      type: "default",
    });

    // Day nodes
    const clusterDays = days.filter(d => d.cluster === key);
    clusterDays.forEach((day, di) => {
      const a2 = (di / clusterDays.length) * 2 * Math.PI + angle;
      const dx = cx + Math.cos(a2) * r;
      const dy = cy + Math.sin(a2) * r;

      nodes.push({
        id: day.slug,
        position: { x: dx + 600, y: dy + 360 },
        data: {
          label: `Day ${String(day.day).padStart(2, "0")}\n${day.title.split(" ").slice(0, 3).join(" ")}`,
        },
        style: {
          background: "#1e2535",
          border: `1px solid ${color}60`,
          color: "#e2e8f0",
          borderRadius: "10px",
          padding: "8px 12px",
          fontSize: "10px",
          cursor: "pointer",
          textAlign: "center" as const,
          whiteSpace: "pre-line",
          width: 100,
          transition: "all 0.2s",
        },
        type: "default",
      });

      // Edge: hub → day
      edges.push({
        id: `e-${key}-${day.slug}`,
        source: `cluster-${key}`,
        target: day.slug,
        style: { stroke: `${color}40`, strokeWidth: 1 },
        animated: false,
      });
    });
  });

  // Centre node
  nodes.unshift({
    id: "center",
    position: { x: 560, y: 330 },
    data: { label: "⚡\nModern C++\nOOP" },
    style: {
      background: "linear-gradient(135deg,#3b82f620,#8b5cf620)",
      border: "2px solid #8b5cf6",
      color: "#fff",
      borderRadius: "50%",
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

  // Edges from center to each cluster hub
  clusterKeys.forEach(key => {
    edges.unshift({
      id: `e-center-${key}`,
      source: "center",
      target: `cluster-${key}`,
      style: { stroke: "#ffffff15", strokeWidth: 1.5 },
      animated: true,
    });
  });

  return { nodes, edges };
}

export default function MindMap({ days, clusters }: Props) {
  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildGraph(days, clusters),
    [days, clusters]
  );
  const [nodes, , onNodesChange] = useNodesState(initNodes);
  const [edges, , onEdgesChange] = useEdgesState(initEdges);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.id.startsWith("cluster-") || node.id === "center") return;
    window.location.href = `/day/${node.id}`;
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      style={{ background: "#0f1117" }}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} color="#1e2535" gap={24} />
      <Controls style={{ background: "#1e2535", border: "1px solid #2a3347" }} />
      <MiniMap
        style={{ background: "#161b27", border: "1px solid #1e2535" }}
        nodeColor={(n) => {
          if (n.id === "center") return "#8b5cf6";
          if (n.id.startsWith("cluster-")) return "#3b82f6";
          return "#2a3347";
        }}
      />
    </ReactFlow>
  );
}
