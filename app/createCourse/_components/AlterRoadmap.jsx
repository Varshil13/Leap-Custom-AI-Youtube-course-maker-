"use client";

import { useMemo, useState, useEffect, useContext, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Trash,
  CornerDownRight,
  GripVertical,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { UserInputContext } from "@/app/_context/UserInputContext";

// (removed unused Button import)



export default function AlterRoadmap() {
    const { userCourseInput, setUserCourseInput } = useContext(UserInputContext);
  const [topics, setTopics] = useState(
  () => {
    const roadmap = Array.isArray(userCourseInput?.roadmap)
      ? userCourseInput.roadmap
      : [];
    return roadmap.map((m, i) => ({
      id: m.id ?? String(i + 1),
      title: m.title ?? `Module ${i + 1}`,
      subtopics: Array.isArray(m.subtopics) ? m.subtopics : [],
    }));
  }
  );
  const firstMount = useRef(true);
  useEffect(() => {
    if (firstMount.current) {
      firstMount.current = false;
      return;
    }
    setUserCourseInput((prev) => ({
      ...prev,
      roadmap: topics,
    }));
   
  }, [topics, setUserCourseInput]);

 
  // ✅ Handle drag reordering
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination, type } = result;

    if (type === "TOPIC") {
      const reordered = Array.from(topics);
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);
      setTopics(reordered);
    } else {
      const parentIndex = parseInt(source.droppableId, 10);
      const updated = [...topics];
      const subList = Array.from(updated[parentIndex].subtopics);
      const [moved] = subList.splice(source.index, 1);
      subList.splice(destination.index, 0, moved);
      updated[parentIndex].subtopics = subList;
      setTopics(updated);
    }
  };

  // dnd-kit sensors for outer grid (no hold; immediate activation)
  const sensors = useSensors(useSensor(PointerSensor));

  // Sortable wrapper for outer card with header-only drag handle
  function SortableCard({ id, disabled = false, children }) {
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id, disabled });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };
    return (
      <div ref={setNodeRef} style={style} className="shrink-0">
        {typeof children === "function"
          ? children({ attributes, listeners })
          : children}
      </div>
    );
  }

  const topicIds = useMemo(() => topics.map((t) => t.id), [topics]);

  // Inline editing state
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [topicTitleDraft, setTopicTitleDraft] = useState("");
  const [editingSub, setEditingSub] = useState(null); // { topicId, index, value }

  // Add a new topic at the end
  const addTopic = () => {
    const newTopic = {
      id: Date.now().toString(),
      title: "New Topic",
      subtopics: [],
    };
    setTopics((prev) => [...prev, newTopic]);
    // Auto-expand the newly added topic so users can immediately add subtopics
    setExpanded((prev) => ({ ...prev, [newTopic.id]: true }));
  };

  // Add the very first subtopic to a topic and begin inline editing
  const addFirstSubtopic = (topicIndex) => {
    if (topicIndex < 0 || topicIndex >= topics.length) return;
    const topicId = topics[topicIndex].id;
    const nextIndex = topics[topicIndex].subtopics.length; // usually 0 for first

    setTopics((prev) => {
      const updated = [...prev];
      const t = updated[topicIndex];
      if (!t) return prev;
      const subs = Array.isArray(t.subtopics) ? [...t.subtopics] : [];
      subs.push(""); // start with empty value; user types immediately
      updated[topicIndex] = { ...t, subtopics: subs };
      return updated;
    });

    // Ensure topic is expanded and open editor for the new subtopic
    setExpanded((prev) => ({ ...prev, [topicId]: true }));
    setEditingSub({ topicId, index: nextIndex, value: "" });
  };

  // Expanded/collapsed state per topic
  const [expanded, setExpanded] = useState(() =>
    Object.fromEntries(
      (Array.isArray(topics) ? topics : []).map((t) => [t.id, false])
    )
  );

  // Keep expanded map in sync with topics list
  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      topics.forEach((t) => {
        if (next[t.id] === undefined) next[t.id] = false;
      });
      Object.keys(next).forEach((id) => {
        if (!topics.some((t) => t.id === id)) delete next[id];
      });
      return next;
    });
  }, [topics]);

  const toggleExpand = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  // (Removed per-card add; using top-right Add Topic button instead)

  // ✅ Add new subtopic *after* given subIndex
  const addSubtopicAfter = (topicIndex, subIndex) => {
    const updated = [...topics];
    updated[topicIndex].subtopics.splice(subIndex + 1, 0, "New Subtopic");
    setTopics(updated);
  };

  // ✅ Delete functions
  const deleteTopic = (index) => {
    const updated = [...topics];
    const [removed] = updated.splice(index, 1);
    setTopics(updated);
    setExpanded((prev) => {
      const next = { ...prev };
      if (removed) delete next[removed.id];
      return next;
    });
  };

  const deleteSubtopic = (topicIndex, subIndex) => {
    const updated = [...topics];
    updated[topicIndex].subtopics.splice(subIndex, 1);
    setTopics(updated);
  };

  // Edit Topic title
  const startEditTopic = (index) => {
    const t = topics[index];
    setEditingTopicId(t.id);
    setTopicTitleDraft(t.title);
    setExpanded((prev) => ({ ...prev, [t.id]: true }));
  };
  const saveEditTopic = (id) => {
    const title = topicTitleDraft.trim();
    setTopics((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: title || t.title } : t))
    );
    setEditingTopicId(null);
  };
  const cancelEditTopic = () => setEditingTopicId(null);

  // Edit Subtopic
  const startEditSub = (topicIndex, subIndex) => {
    setEditingSub({
      topicId: topics[topicIndex].id,
      index: subIndex,
      value: topics[topicIndex].subtopics[subIndex],
    });
    setExpanded((prev) => ({ ...prev, [topics[topicIndex].id]: true }));
  };
  const saveEditSub = () => {
    if (!editingSub) return;
    const { topicId, index, value } = editingSub;
    const trimmed = (value || "").trim();
    setTopics((prev) =>
      prev.map((t) => {
        if (t.id !== topicId) return t;
        const next = [...t.subtopics];
        const original = next[index];

        // If nothing typed and original was the temporary empty stub, remove it
        if (trimmed === "") {
          if (original === "") {
            next.splice(index, 1);
            return { ...t, subtopics: next };
          }
          // Otherwise, keep original value (no change)
          return t;
        }

        // Persist the edited non-empty value
        next[index] = trimmed;
        return { ...t, subtopics: next };
      })
    );
    setEditingSub(null);
  };
  const cancelEditSub = () => {
    if (!editingSub) return;
    const { topicId, index } = editingSub;
    // If the current subtopic in state is an empty stub (from addFirstSubtopic), remove it
    setTopics((prev) =>
      prev.map((t) => {
        if (t.id !== topicId) return t;
        const next = [...t.subtopics];
        if (next[index] === "") {
          next.splice(index, 1);
          return { ...t, subtopics: next };
        }
        return t;
      })
    );
    setEditingSub(null);
  };

  return (
    <div className="p-8 ">
      <div className="mb-6 flex flex-col items-center justify-center sticky top-0 z-10 bg-background backdrop-blur ">
        <h2 className="text-2xl font-bold text-center my-1 text-foreground">Manage Course Roadmap</h2>
        <button
          type="button"
          onClick={addTopic}
          className="inline-flex items-center gap-2 rounded-md border border-primary text-primary hover:bg-primary/20 px-3 py-2 text-sm mt-2 bg-background transition-colors"
        >
          <Plus size={16} />
          Add Topic
        </button>
      </div>

      {/* Outer grid with dnd-kit for smooth vertical+horizontal sorting */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={({ active, over }) => {
          if (!over || active.id === over.id) return;
          const oldIndex = topics.findIndex((t) => t.id === active.id);
          const newIndex = topics.findIndex((t) => t.id === over.id);
          setTopics((items) => arrayMove(items, oldIndex, newIndex));
        }}
      >
        <SortableContext items={topicIds} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full max-w-7xl mx-auto">
            {topics.map((topic, index) => (
              <SortableCard
                key={topic.id}
                id={topic.id}
                disabled={editingTopicId === topic.id}
              >
                {({ attributes, listeners }) => (
                    <div className="border border-border rounded-xl shadow-sm bg-card">
                    {/* Major Topic Header */}
                    <div className="flex justify-between items-center p-2">
                      <div className="flex items-center gap-2">
                        {/* Expand/Collapse toggle */}
                        <button
                          type="button"
                          onClick={() => toggleExpand(topic.id)}
                          aria-label={
                            expanded[topic.id] ? "Collapse" : "Expand"
                          }
                          className="p-1 rounded hover:bg-muted transition-colors"
                        >
                          {expanded[topic.id] ? (
                            <ChevronDown size={18} />
                          ) : (
                            <ChevronRight size={18} />
                          )}
                        </button>
                        <button
                          type="button"
                          aria-label="Drag card"
                          className="cursor-grab active:cursor-grabbing text-primary"
                          {...(editingTopicId === topic.id
                            ? {}
                            : { ...attributes, ...listeners })}
                          disabled={editingTopicId === topic.id}
                        >
                          <GripVertical size={18} />
                        </button>
                        {editingTopicId === topic.id ? (
                          <input
                            autoFocus
                            value={topicTitleDraft}
                            onChange={(e) => setTopicTitleDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEditTopic(topic.id);
                              if (e.key === "Escape") cancelEditTopic();
                            }}
                            className="font-semibold border border-primary bg-background text-foreground rounded-md py-1 text-sm px-2 focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        ) : (
                          <span className="font-semibold text-foreground">
                            {index + 1}. {topic.title}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {editingTopicId === topic.id ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveEditTopic(topic.id)}
                              className="text-primary hover:text-secondary"
                              aria-label="Save title"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditTopic}
                              className="text-destructive hover:text-muted"
                              aria-label="Cancel edit"
                            >
                              <X size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEditTopic(index)}
                              className="text-primary hover:text-secondary"
                              aria-label="Edit title"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteTopic(index)}
                              className="text-destructive hover:text-muted"
                            >
                              <Trash size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Subtopics - only visible when expanded */}
                    {expanded[topic.id] && (
                      <div className="px-4 pb-4">
                        <div className="text-sm font-medium mb-2 text-primary">
                          Subtopics
                        </div>
                        {!topic.subtopics || topic.subtopics.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-primary p-4 justify-center text-xs flex items-center text-secondary">
                            <button
                              type="button"
                              onClick={() => addFirstSubtopic(index)}
                              className="inline-flex items-center gap-2 rounded-md border border-primary text-primary bg-background hover:bg-primary/20 px-3 py-1.5 text-xs transition-colors"
                            >
                              <Plus size={10} /> Add first subtopic
                            </button>
                          </div>
                        ) : (
                          <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable
                              droppableId={index.toString()}
                              type="SUBTOPIC"
                            >
                              {(subProvided) => (
                                <ul
                                  {...subProvided.droppableProps}
                                  ref={subProvided.innerRef}
                                  className="space-y-2"
                                >
                                  {topic.subtopics.map((sub, subIndex) => (
                                    <Draggable
                                      key={`${topic.id}-${subIndex}`}
                                      draggableId={`${topic.id}-${subIndex}`}
                                      index={subIndex}
                                      isDragDisabled={
                                        !!editingSub &&
                                        editingSub.topicId === topic.id &&
                                        editingSub.index === subIndex
                                      }
                                    >
                                      {(dragProvided) => (
                                        <li
                                          ref={dragProvided.innerRef}
                                          {...dragProvided.draggableProps}
                                          {...dragProvided.dragHandleProps}
                                          className="p-2 border border-border rounded-lg shadow-sm flex justify-between items-center bg-muted text-foreground"
                                        >
                                          {editingSub &&
                                          editingSub.topicId === topic.id &&
                                          editingSub.index === subIndex ? (
                                            <div className="flex items-center gap-2 w-full">
                                              <input
                                                autoFocus
                                                value={editingSub.value}
                                                onChange={(e) =>
                                                  setEditingSub({
                                                    ...editingSub,
                                                    value: e.target.value,
                                                  })
                                                }
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter")
                                                    saveEditSub();
                                                  if (e.key === "Escape")
                                                    cancelEditSub();
                                                }}
                                                className="flex-1 border border-primary bg-background text-foreground rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                              />
                                            </div>
                                          ) : (
                                            <span>
                                              {index + 1}.{subIndex + 1} {sub}
                                            </span>
                                          )}
                                          <div className="flex gap-2">
                                            {editingSub &&
                                            editingSub.topicId === topic.id &&
                                            editingSub.index === subIndex ? (
                                              <>
                                                <button
                                                  type="button"
                                                  onClick={saveEditSub}
                                                  className="text-primary hover:text-secondary"
                                                >
                                                  <Check size={16} />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={cancelEditSub}
                                                  className="text-destructive hover:text-muted"
                                                >
                                                  <X size={16} />
                                                </button>
                                              </>
                                            ) : (
                                              <>
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    startEditSub(
                                                      index,
                                                      subIndex
                                                    )
                                                  }
                                                  className="text-primary hover:text-secondary"
                                                >
                                                  <Pencil size={16} />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    addSubtopicAfter(
                                                      index,
                                                      subIndex
                                                    )
                                                  }
                                                  className="text-primary hover:text-secondary"
                                                >
                                                  <CornerDownRight size={16} />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    deleteSubtopic(
                                                      index,
                                                      subIndex
                                                    )
                                                  }
                                                  className="text-destructive hover:text-muted"
                                                >
                                                  <Trash size={16} />
                                                </button>
                                              </>
                                            )}
                                          </div>
                                        </li>
                                      )}
                                    </Draggable>
                                  ))}
                                  {subProvided.placeholder}
                                </ul>
                              )}
                            </Droppable>
                          </DragDropContext>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </SortableCard>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
