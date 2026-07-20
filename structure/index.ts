import {CogIcon} from '@sanity/icons/Cog'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {PackageIcon} from '@sanity/icons/Package'
import {TagIcon} from '@sanity/icons/Tag'
import type {StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Trạm Laptop Việt')
    .items([
      S.listItem()
        .title('Cài đặt website')
        .icon(CogIcon)
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
            .title('Cài đặt website'),
        ),
      S.divider(),
      S.documentTypeListItem('product').title('Sản phẩm').icon(PackageIcon),
      S.documentTypeListItem('category').title('Danh mục').icon(TagIcon),
      S.documentTypeListItem('article').title('Bài viết').icon(DocumentTextIcon),
      S.divider(),
      S.listItem()
        .title('Sự kiện website')
        .icon(DocumentTextIcon)
        .child(
          S.documentTypeList('webEvent')
            .title('Sự kiện website')
            .defaultOrdering([{field: 'occurredAt', direction: 'desc'}]),
        ),
    ])
