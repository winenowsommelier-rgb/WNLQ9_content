<?php
declare(strict_types=1);

namespace WineNow\SEO\Plugin;

use Magento\Catalog\Model\Product;
use Magento\Framework\App\ResourceConnection;

class ProductTitlePlugin
{
    private ResourceConnection $resource;

    public function __construct(ResourceConnection $resource)
    {
        $this->resource = $resource;
    }

    public function afterLoad(Product $product, Product $result)
    {
        if (!$product->getId() || $product->getTypeId() === 'configurable') {
            return $result;
        }

        $newMetaTitle = $this->generateMetaTitle($product);
        if ($newMetaTitle) {
            $product->setMetaTitle($newMetaTitle);
        }

        return $result;
    }

    private function generateMetaTitle(Product $product): ?string
    {
        $brand = $product->getAttributeText('brand') ?? 'Wine';
        $category = $product->getCategory()?->getName() ?? '';
        $name = $product->getName();
        $origin = $product->getAttributeText('country_origin') ?? '';

        // Build title: Brand Name | Category | Origin | Thailand
        $title = trim("{$brand} {$name}");

        if (!empty($origin)) {
            $title .= " | {$origin}";
        }

        // Keep under 60 characters for SERP display
        if (strlen($title) > 58) {
            $title = substr($title, 0, 55) . '...';
        }

        return $title;
    }
}
