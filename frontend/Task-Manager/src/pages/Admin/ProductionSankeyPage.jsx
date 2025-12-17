import React, { useEffect, useState, useMemo } from 'react';
import { ResponsiveContainer, Sankey, Tooltip, Rectangle } from 'recharts';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import toast from 'react-hot-toast';

// A custom tooltip to show the flow value
const CustomTooltip = ({ active, payload }) => {
  // Check if payload is valid and has an entry
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    // Check if it's a LINK payload (it has source and target)
    if (data.source && data.target) {
      return (
        <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg p-3 border border-gray-200">
          <p className="font-semibold text-gray-800">{`${data.source.name} → ${data.target.name}`}</p>
          <p className="text-sm text-primary font-bold">{data.value} Hours Logged</p>
        </div>
      );
    }

    // Check if it's a NODE payload (it has name and value)
    if (data.name && data.value) {
       return (
        <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg p-3 border border-gray-200">
          <p className="font-semibold text-gray-800">{data.name}</p>
          <p className="text-sm text-primary font-bold">{data.value} Total Hours</p>
        </div>
      );
    }
  }
  return null;
};

// This component renders the nodes (rectangles) and their labels
const CustomNode = (props) => {
  const { x, y, width, height, index, payload } = props;
  const isOutflowNode = x > 100;

  return (
    <g>
      <Rectangle
        {...props}
        fill={payload.fill} // Use the color from the data
        fillOpacity="1"
      />
      <text
        x={isOutflowNode ? x + width + 6 : x - 6} // Position text to the right or left
        y={y + height / 2}
        dy="0.35em"
        textAnchor={isOutflowNode ? "start" : "end"} // Align text
        fill="#333" // Text color
        style={{ fontSize: 14, fontWeight: 500 }}
      >
        {payload.name}
      </text>
    </g>
  );
};

const ProductionSankeyPage = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await axiosInstance.get(API_PATHS.VISUALS.GET_PRODUCTION_FLOW);
        setData(response.data);
      } catch (error) {
        toast.error("Could not load production flow data.");
        console.error("Error fetching Sankey data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- START: MODIFIED useMemo ---
  const processedData = useMemo(() => {
    if (!data) return null;

    // 1. Define colors
    const nodeColors = {
      'Product': '#3B82F6',   // Blue
      'Stage': '#6B7280',     // Gray
      'Outcome-Good': '#10B981', // Green
      'Outcome-Bad': '#EF4444',  // Red
    };

    const linkColors = {
      'Waste': 'rgba(239, 68, 68, 0.4)', // Red
      'ValueAdd': 'rgba(16, 185, 129, 0.4)', // Green
      'Neutral': 'rgba(107, 114, 128, 0.4)' // Gray
    };

    // 2. Add 'fill' color to each node
    const finalNodes = data.nodes.map((node, index) => {
      let color = nodeColors.Stage; // default
      if (node.name.startsWith('Product:')) color = nodeColors.Product;
      if (node.name.startsWith('Outcome:')) {
         color = node.name.includes('Waste') ? nodeColors['Outcome-Bad'] : nodeColors['Outcome-Good'];
      }
      return { ...node, fill: color, key: `node-${index}` }; // Add key for React
    });

    // 3. Add 'fill' color to each link
    const finalLinks = data.links.map((link, index) => {
      const sourceNode = finalNodes[link.source];
      const targetNode = finalNodes[link.target]; 
      
      let linkFill = linkColors.Neutral; // default link color (Gray)

      // If the link is flowing TO or FROM a "Waste" or "Rework" node, make it Red
      if (targetNode.name.includes('Waste') || 
          sourceNode.name.includes('Rework') || 
          targetNode.name.includes('Rework')) {
        linkFill = linkColors.Waste;
      } 
      // If the link is flowing TO "Value-Add", make it Green
      else if (targetNode.name.includes('Value-Add')) {
        linkFill = linkColors.ValueAdd;
      }
      
      return { 
        ...link, 
        fill: linkFill, // This is the color recharts looks for
        stroke: "transparent", // Use transparent stroke for a cleaner look
        key: `link-${index}` // Add key for React
      };
    });
    
    return { nodes: finalNodes, links: finalLinks };
  }, [data]);
  // --- END: MODIFIED useMemo ---

  return (
    <>
      <div className="p-4 md:p-6">
        <h2 className="text-2xl font-bold text-gray-800">Production Flow (Cost of Waste)</h2>
        <p className="mt-1 text-sm text-gray-600">
          This diagram shows the flow of logged labor hours from a product line to its manufacturing stage, and finally to its outcome (Value-Add vs. Waste).
        </p>
      </div>
      
      <div className="mt-4 card" style={{ height: '70vh' }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-500">Loading chart data...</div>
        ) : !processedData || processedData.links.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">No data available for this chart.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <Sankey
              data={processedData}
              node={<CustomNode />}
              nodePadding={50}
              margin={{
                left: 150,
                right: 150,
                top: 20,
                bottom: 20,
              }}
              // --- THIS IS THE FIX ---
              // By REMOVING the 'link' prop here,
              // recharts will now use the 'fill' and 'stroke' properties
              // from each individual link object in our 'processedData.links' array.
              //
              // link={{ strokeOpacity: 0.6 }} // 👈 DELETED THIS LINE
              //
              // --- END OF FIX ---
              dataKey="value"
              nameKey="name" // This fixes the React key warning
            >
              <Tooltip content={<CustomTooltip />} />
            </Sankey>
          </ResponsiveContainer>
        )}
      </div>
    </>
  );
};

export default ProductionSankeyPage;