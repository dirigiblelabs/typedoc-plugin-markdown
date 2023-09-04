import * as Handlebars from 'handlebars';
import {
  DeclarationReflection,
  ProjectReflection,
  ReflectionGroup,
} from 'typedoc';
import { MarkdownTheme } from '../../theme';
import { escapeChars } from '../../utils';

export default function (theme: MarkdownTheme) {
  Handlebars.registerHelper(
    'toc',
    function (this: ProjectReflection | DeclarationReflection) {
      const md: string[] = [];

      const { hideInPageTOC } = theme;

      const isVisible = this.groups?.some((group) =>
        group.allChildrenHaveOwnDocument(),
      );

      function pushGroup(group: ReflectionGroup, md: string[]) {
        const children = group.children.map(
          (child) =>
            `- [${escapeChars(child.name)}](${Handlebars.helpers.relativeURL(
              child.url,
            )}) ${getCommentsAsString(child)}`,
        );
        md.push(children.join('\n'));
      }

      if ((!hideInPageTOC && this.groups) || (isVisible && this.groups)) {
        if (!hideInPageTOC) {
          md.push(`## Table of contents\n\n`);
        }
        const headingLevel = hideInPageTOC ? `##` : `###`;
        this.groups?.forEach((group) => {
          const groupTitle = group.title;
          if (group.categories) {
            group.categories.forEach((category) => {
              md.push(`${headingLevel} ${category.title} ${groupTitle}\n\n`);
              pushGroup(category as any, md);
              md.push('\n');
            });
          } else {
            if (!hideInPageTOC || group.allChildrenHaveOwnDocument()) {
              md.push(`${headingLevel} ${groupTitle}\n\n`);
              pushGroup(group, md);
              md.push('\n');
            }
          }
        });
      }
      return md.length > 0 ? md.join('\n') : null;
    },
  );
}

function getCommentsAsString(child) {
  const typedocComments = new Set();

  if (!child.signatures && child.comment) {
      typedocComments.add(child.comment);
  } else if (child.signatures) {
      for (const signature of child.signatures) {
          if (signature.comment)
              typedocComments.add(signature.comment);
      }
  }

  if (typedocComments.size < 1) return "";


  let allDeclarationCommentsString = "--- ";
  for (const comment of typedocComments) {
      const commentData = Handlebars.helpers.comments(comment);
      allDeclarationCommentsString += commentData;
  }

  return allDeclarationCommentsString;
}
