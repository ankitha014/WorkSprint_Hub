import { useState } from 'react';
import { Search, X, Filter, CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Task, TaskStatus, TaskPriority } from '@/types';

export interface TaskFilterState {
  search: string;
  status: string;
  priority: string;
  assignee: string;
  dueBefore: Date | undefined;
  dueAfter: Date | undefined;
}

const defaultFilters: TaskFilterState = {
  search: '',
  status: 'all',
  priority: 'all',
  assignee: 'all',
  dueBefore: undefined,
  dueAfter: undefined,
};

interface TaskFiltersProps {
  filters: TaskFilterState;
  onFiltersChange: (filters: TaskFilterState) => void;
  members?: { user_id: string; profiles?: { full_name: string | null; email: string | null } | null }[];
  showAssigneeFilter?: boolean;
}

export function useTaskFilters() {
  const [filters, setFilters] = useState<TaskFilterState>(defaultFilters);
  return { filters, setFilters };
}

export function applyTaskFilters(tasks: Task[], filters: TaskFilterState): Task[] {
  return tasks.filter((t) => {
    if (filters.search && !t.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !(t.description || '').toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status !== 'all' && t.status !== filters.status) return false;
    if (filters.priority !== 'all' && t.priority !== filters.priority) return false;
    if (filters.assignee !== 'all') {
      if (filters.assignee === 'unassigned' && t.assignee_id) return false;
      if (filters.assignee !== 'unassigned' && t.assignee_id !== filters.assignee) return false;
    }
    if (filters.dueAfter && t.due_date && new Date(t.due_date) < filters.dueAfter) return false;
    if (filters.dueBefore && t.due_date && new Date(t.due_date) > filters.dueBefore) return false;
    if ((filters.dueAfter || filters.dueBefore) && !t.due_date) return false;
    return true;
  });
}

export function TaskFilters({ filters, onFiltersChange, members = [], showAssigneeFilter = true }: TaskFiltersProps) {
  const activeCount = [
    filters.status !== 'all',
    filters.priority !== 'all',
    filters.assignee !== 'all',
    !!filters.dueBefore,
    !!filters.dueAfter,
  ].filter(Boolean).length;

  const update = (partial: Partial<TaskFilterState>) =>
    onFiltersChange({ ...filters, ...partial });

  const clearAll = () => onFiltersChange(defaultFilters);

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search tasks by title or description..."
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          className="pl-9 pr-9"
        />
        {filters.search && (
          <button
            onClick={() => update({ search: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-muted-foreground mr-1">
          <Filter size={14} />
          <span className="text-xs font-medium">Filters</span>
          {activeCount > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              {activeCount}
            </Badge>
          )}
        </div>

        {/* Status */}
        <Select value={filters.status} onValueChange={(v) => update({ status: v })}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        {/* Priority */}
        <Select value={filters.priority} onValueChange={(v) => update({ priority: v })}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>

        {/* Assignee */}
        {showAssigneeFilter && (
          <Select value={filters.assignee} onValueChange={(v) => update({ assignee: v })}>
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.user_id} value={m.user_id}>
                  {m.profiles?.full_name || m.profiles?.email || 'Member'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Due After */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1.5", filters.dueAfter && "border-primary text-primary")}>
              <CalendarIcon size={12} />
              {filters.dueAfter ? `From ${format(filters.dueAfter, 'MMM d')}` : 'Due from'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.dueAfter}
              onSelect={(d) => update({ dueAfter: d })}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        {/* Due Before */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1.5", filters.dueBefore && "border-primary text-primary")}>
              <CalendarIcon size={12} />
              {filters.dueBefore ? `Until ${format(filters.dueBefore, 'MMM d')}` : 'Due until'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.dueBefore}
              onSelect={(d) => update({ dueBefore: d })}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-8 text-xs text-muted-foreground">
            <X size={12} className="mr-1" /> Clear all
          </Button>
        )}
      </div>
    </div>
  );
}
