import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Folder, FolderOpen, Tag, Lock } from 'lucide-react';

export const CategoryTreeSelector = ({
  categories = [],
  value = '',
  onChange,
  placeholder = 'Chọn danh mục lá...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { treeNodes, catMap } = useMemo(() => {
    const map = new Map();
    categories.forEach((c) => {
      map.set(String(c._id), { ...c, children: [] });
    });

    const roots = [];
    categories.forEach((c) => {
      const node = map.get(String(c._id));
      const pId = c.parentId ? String(c.parentId) : null;
      if (pId && map.has(pId)) {
        map.get(pId).children.push(node);
      } else {
        roots.push(node);
      }
    });

    return { treeNodes: roots, catMap: map };
  }, [categories]);

  const selectedPathLabel = useMemo(() => {
    if (!value || !catMap.has(String(value))) return '';
    const parts = [];
    let curr = catMap.get(String(value));
    const visited = new Set();
    while (curr && !visited.has(String(curr._id))) {
      visited.add(String(curr._id));
      parts.unshift(curr.name);
      curr = curr.parentId ? catMap.get(String(curr.parentId)) : null;
    }
    return parts.join(' > ');
  }, [value, catMap]);

  const toggleExpand = (e, catId) => {
    e.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const renderNodes = (nodes, depth = 0) =>
    nodes.map((node) => {
      const idStr = String(node._id);
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedIds.has(idStr);
      const isSelected = String(value) === idStr;

      return (
        <div key={idStr}>
          <div
            onClick={(e) => {
              if (hasChildren) {
                toggleExpand(e, idStr);
              } else {
                onChange?.(idStr);
                setIsOpen(false);
              }
            }}
            style={{ paddingLeft: `${12 + depth * 18}px` }}
            className={`flex items-center justify-between pr-3 py-2 text-xs transition-colors cursor-pointer ${
              isSelected
                ? 'bg-blue-600/20 text-blue-300 font-bold'
                : hasChildren
                ? 'text-slate-300 hover:bg-slate-800/70 font-semibold'
                : 'text-slate-200 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={(e) => toggleExpand(e, idStr)}
                  className="p-0.5 text-slate-400 hover:text-white"
                >
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              ) : (
                <span className="w-4 inline-block" />
              )}
              {hasChildren ? (
                isExpanded ? (
                  <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )
              ) : (
                <Tag className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              )}
              <span className="truncate">{node.name}</span>
            </div>

            {hasChildren ? (
              <span
                title="Danh mục nhóm — bấm để mở danh mục con"
                className="text-[10px] text-slate-500 flex items-center gap-1 shrink-0"
              >
                <Lock className="w-2.5 h-2.5" /> Nhóm
              </span>
            ) : isSelected ? (
              <span className="text-[10px] text-blue-400 font-bold shrink-0">Đang chọn</span>
            ) : null}
          </div>

          {hasChildren && isExpanded && renderNodes(node.children, depth + 1)}
        </div>
      );
    });

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-xl text-xs text-left flex items-center justify-between gap-2 focus:outline-none focus:border-blue-500 cursor-pointer"
      >
        <span className={selectedPathLabel ? 'text-slate-100 font-semibold truncate' : 'text-slate-500'}>
          {selectedPathLabel || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 z-50 max-h-64 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1">
          {treeNodes.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-slate-500">
              Chưa có danh mục nào trong hệ thống.
            </div>
          ) : (
            renderNodes(treeNodes)
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryTreeSelector;
