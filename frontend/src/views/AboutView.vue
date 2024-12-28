<template>
  <div class="about">
    <h1>About Us</h1>
    <p>Welcome to our bookstore! We offer a wide range of books from various genres and authors. Our mission is to provide readers with the best selection of books and a seamless shopping experience.</p>
    <h2>Our Team</h2>
    <ul>
      <li>John Doe - Founder & CEO</li>
      <li>Jane Smith - Chief Editor</li>
      <li>Emily Johnson - Marketing Manager</li>
    </ul>
    <h2>Contact Us</h2>
    <p>If you have any questions or feedback, feel free to reach out to us at <a href="mailto:info@bookstore.com">info@bookstore.com</a>.</p>
  </div>
</template>

<script>
export default {
  name: 'AboutView',
};
</script>

<style scoped>
.about {
  padding: 2rem;
}
.about h1, .about h2 {
  color: #333;
}
.about p, .about ul {
  color: #666;
}
.about ul {
  list-style-type: none;
  padding: 0;
}
.about ul li {
  margin: 0.5rem 0;
}
</style>
