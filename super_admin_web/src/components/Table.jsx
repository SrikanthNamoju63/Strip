import React from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

const Table = ({
    columns,
    data,
    isLoading,
    onRowClick,
    actions,
    pagination,
    searchPlaceholder = "Search...",
    onSearch,
    searchValue,
    filter
}) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
            {/* Table Toolbar */}
            {(onSearch || filter) && (
                <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4 bg-gray-50/50">
                    {onSearch && (
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder={searchPlaceholder}
                                value={searchValue}
                                onChange={(e) => onSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                            />
                        </div>
                    )}
                    {filter && (
                        <div className="flex items-center">
                            {filter}
                        </div>
                    )}
                </div>
            )}

            {/* Table Content */}
            <div className="overflow-x-auto flex-1 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            {columns.map((col, index) => (
                                <th
                                    key={index}
                                    className={`px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider ${col.className || ''}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                            {actions && <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {isLoading ? (
                            // Skeleton loading rows
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    {columns.map((_, j) => (
                                        <td key={j} className="px-6 py-4">
                                            <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                                        </td>
                                    ))}
                                    {actions && <td className="px-6 py-4"><div className="h-8 bg-gray-100 rounded w-8 ml-auto"></div></td>}
                                </tr>
                            ))
                        ) : data.length > 0 ? (
                            data.map((row, rowIndex) => (
                                <tr
                                    key={row._id || rowIndex}
                                    onClick={() => onRowClick && onRowClick(row)}
                                    className={`group transition-colors duration-150 ${onRowClick ? 'cursor-pointer hover:bg-blue-50/50' : 'hover:bg-gray-50/50'}`}
                                >
                                    {columns.map((col, colIndex) => (
                                        <td key={colIndex} className="px-6 py-4 text-sm text-gray-600 border-b border-transparent group-hover:border-gray-100">
                                            {col.render ? col.render(row) : row[col.accessor]}
                                        </td>
                                    ))}
                                    {actions && (
                                        <td className="px-6 py-4 text-right">
                                            {actions(row)}
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-12 text-center text-gray-400">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                            <Search size={24} className="text-gray-300" />
                                        </div>
                                        <p>No records found</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination (Simple version) */}
            {pagination && (
                <div className="p-4 border-t border-gray-100 bg-white flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                        Showing {data.length} results
                    </span>
                    <div className="flex gap-2">
                        <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>
                            <ChevronLeft size={16} />
                        </button>
                        <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Table;
