import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BlogArticle, generateBlogMetadata } from "@/components/blog/blog-article";
import { blogArticles, getArticleBySlug } from "@/lib/blog-data";
import { generateArticleContent } from "@/lib/blog-content";

export function generateStaticParams() {
  return blogArticles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return generateBlogMetadata(article);
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();
  const content = generateArticleContent(slug);
  if (!content) notFound();
  return <BlogArticle meta={article} content={content} />;
}
