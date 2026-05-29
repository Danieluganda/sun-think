import { CourseCard } from "./CourseCard.jsx";

export function CourseGrid({ courses, onSelect, onQueue }) {
  return (
    <div className="course-grid">
      {courses.map((course) => (
        <CourseCard course={course} key={course.id} onSelect={onSelect} onQueue={onQueue} />
      ))}
    </div>
  );
}
