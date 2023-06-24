import { useRouter } from "next/router";

const SingleCourse = () => {
  const router = useRouter();
  return (
    <>
      <h1>Course slug is: {JSON.stringify(router.query.slug)}</h1>
    </>
  );
};

export default SingleCourse;
