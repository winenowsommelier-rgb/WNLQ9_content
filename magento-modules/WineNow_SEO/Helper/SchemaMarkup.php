<?php
declare(strict_types=1);

namespace WineNow\SEO\Helper;

use Magento\Catalog\Model\Product;
use Magento\Catalog\Model\ResourceModel\Product\CollectionFactory;
use Magento\Framework\App\Helper\AbstractHelper;
use Magento\Review\Model\ReviewFactory;
use Magento\Review\Model\RatingFactory;

class SchemaMarkup extends AbstractHelper
{
    private ReviewFactory $reviewFactory;
    private RatingFactory $ratingFactory;
    private CollectionFactory $productCollectionFactory;

    public function __construct(
        ReviewFactory $reviewFactory,
        RatingFactory $ratingFactory,
        CollectionFactory $productCollectionFactory
    ) {
        $this->reviewFactory = $reviewFactory;
        $this->ratingFactory = $ratingFactory;
        $this->productCollectionFactory = $productCollectionFactory;
    }

    public function generateProductSchema(Product $product): string
    {
        $schema = [
            '@context' => 'https://schema.org/',
            '@type' => 'Product',
            'name' => $product->getName(),
            'description' => $this->getDescription($product),
            'image' => $this->getProductImage($product),
            'brand' => [
                '@type' => 'Brand',
                'name' => $product->getAttributeText('brand') ?? 'Wine Now Thailand'
            ],
            'offers' => $this->generateOffers($product),
            'aggregateRating' => $this->generateAggregateRating($product),
            'review' => $this->generateReviews($product),
        ];

        // Add manufacturer if available
        if ($product->getAttributeText('manufacturer')) {
            $schema['manufacturer'] = [
                '@type' => 'Organization',
                'name' => $product->getAttributeText('manufacturer')
            ];
        }

        return json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    private function generateOffers(Product $product): array
    {
        $finalPrice = $product->getFinalPrice();
        $availability = $product->isInStock() ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';

        return [
            '@type' => 'Offer',
            'url' => $product->getProductUrl(),
            'priceCurrency' => 'THB',
            'price' => number_format((float)$finalPrice, 2, '.', ''),
            'availability' => $availability,
            'seller' => [
                '@type' => 'Organization',
                'name' => 'Wine Now Thailand'
            ]
        ];
    }

    private function generateAggregateRating(Product $product): ?array
    {
        if (!$product->getRatingSummary()) {
            return null;
        }

        $rating = $product->getRatingSummary();

        return [
            '@type' => 'AggregateRating',
            'ratingValue' => round($rating->getRatingSummary() / 20, 1), // Magento stores as 0-100
            'ratingCount' => (int)$rating->getReviewsCount(),
            'bestRating' => '5',
            'worstRating' => '1'
        ];
    }

    private function generateReviews(Product $product): array
    {
        $reviews = [];
        $collection = $this->reviewFactory->create()
            ->getCollection()
            ->addEntityFilter('product', $product->getId())
            ->setDateOrder()
            ->setPageSize(5)
            ->load();

        foreach ($collection as $review) {
            if (!$review->isApproved()) {
                continue;
            }

            $reviews[] = [
                '@type' => 'Review',
                'reviewRating' => [
                    '@type' => 'Rating',
                    'ratingValue' => $review->getRating()
                ],
                'author' => [
                    '@type' => 'Person',
                    'name' => $review->getNickname() ?? 'Anonymous'
                ],
                'reviewBody' => substr($review->getDetail(), 0, 300),
                'datePublished' => $review->getCreatedAt()
            ];
        }

        return $reviews;
    }

    private function getProductImage(Product $product): string
    {
        $image = $product->getImage();
        if (!$image || $image === 'no_selection') {
            return '';
        }

        $imageUrl = $product->getMediaGalleryUrl();
        return $imageUrl ?? '';
    }

    private function getDescription(Product $product): string
    {
        $description = $product->getDescription() ?? $product->getShortDescription();
        if (!$description) {
            return '';
        }

        $clean = strip_tags($description);
        $clean = preg_replace('/\s+/', ' ', $clean);
        return substr(trim($clean), 0, 300);
    }
}
