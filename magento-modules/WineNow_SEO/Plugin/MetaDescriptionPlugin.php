<?php
declare(strict_types=1);

namespace WineNow\SEO\Plugin;

use Magento\Catalog\Block\Product\View;

class MetaDescriptionPlugin
{
    public function beforeToHtml(View $subject): void
    {
        $product = $subject->getProduct();
        if (!$product || !$product->getId()) {
            return;
        }

        $metaDescription = $this->generateMetaDescription($product);
        if ($metaDescription) {
            $product->setMetaDescription($metaDescription);
        }
    }

    private function generateMetaDescription($product): ?string
    {
        $brand = $product->getAttributeText('brand') ?? 'Wine';
        $category = $product->getCategory()?->getName() ?? 'Premium Selection';
        $shortDesc = $product->getShortDescription() ?? $product->getDescription();

        if (!$shortDesc) {
            return null;
        }

        // Clean and truncate short description
        $shortDesc = trim(preg_replace('/\s+/', ' ', strip_tags($shortDesc)));
        $shortDesc = substr($shortDesc, 0, 80);

        $origin = $product->getAttributeText('country_origin') ?? '';

        // Build description: Brand Category. Short description. Origin. CTA
        $parts = [
            "{$brand} {$category}",
            $shortDesc,
            $origin ? "{$origin} wine" : '',
            'Fast delivery Thailand. Shop now →'
        ];

        $description = implode('. ', array_filter($parts));

        // Trim to 160 characters (SERP limit)
        if (strlen($description) > 160) {
            $description = substr($description, 0, 155) . '...';
        }

        return $description;
    }
}
