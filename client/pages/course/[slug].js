import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";

const SingleCourse = ({ course }) => {
  const router = useRouter();
  const { slug } = router.query;

  return (
    <>
      <diV className="container-fluid">
        <div className="row">
          <pre>{JSON.stringify(course, null, 4)}</pre>
        </div>
      </diV>
    </>
  );
};

// If you export a function called getServerSideProps (Server-Side Rendering) from a page, Next.js will pre-render this page on each request using the data returned by getServerSideProps.
export async function getServerSideProps({ query }) {
  const { data } = await axios.get(`${process.env.API}/course/${query.slug}`);
  return {
    props: {
      course: data,
    },
  };
}

export default SingleCourse;
