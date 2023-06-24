import { useContext, useEffect, useState } from "react";
import { Context } from "../../context";
import UserRoute from "../../components/routes/UserRoute";
import axios from "axios";

const UserIndex = () => {
  const {
    state: { user },
  } = useContext(Context);

  const [courses, setCourses] = useState([]);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    const { data } = await axios.get("/api/user-courses");
    setCourses(data);
  };

  return (
    <UserRoute>
      <h1 className="jumbotron text-center square">User Dashboard</h1>
      <pre>{JSON.stringify(courses, null, 4)}</pre>
    </UserRoute>
  );
};

export default UserIndex;
